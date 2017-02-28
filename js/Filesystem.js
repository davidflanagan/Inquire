"use strict";

// Trying this again using filenames as the unique identifier and
// getting rid of the fileid stuff completely. It will make sharing
// easier and might make downloading quicker if we just go directly to
// the storage server to get the download url instead of going to the db
// to get it?

class Filesystem {
  constructor(firebase) {
    this.firebase = firebase;
    this.database = firebase.database();
    this.storage = firebase.storage();
    this.auth = firebase.auth();
  }

  get userid() {
    if (!this.auth.currentUser) {
      throw new Error('Must be logged in.');
    }
    return this.auth.currentUser.uid
  }

  // Internal API for getting a file for any user.
  // XXX
  // It might be possible to optimize this by caching the download URL
  // in the db, rather than looking it up each time. For now I'm keeping
  // it simple.
  async _getFile(userid, filename) {
    let ref = this.storage.ref('u/' + userid + '/' + filename);
    let url;
    try {
      url = await ref.getDownloadURL();
    }
    catch(e) {
      throw new Error('No such file: ' + filename);
    }
    let response = await fetch(url);
    let body = await response.text();
    return body;
  }

  // Get the contents of the specified file, which must be owned by
  // the current user.  Returns a promise that resolves to the text of
  // the file or errors.
  async getFile(filename) {
    return await this._getFile(this.userid, filename);
  }

  async isShared(filename) {
    let userid = this.userid;
    let dbref = this.database.ref('files').child(userid).child(filename);
    let snapshot = await dbref.child('public').once('value');
    if (!snapshot.exists()) {
      throw new Error('No such file: ' + filename);
    }
    return snapshot.val()
  }

  // Returns a promise that resolves to an object whose properties are
  // filenames and whose values are objects describing the file. All the
  // files owned by the current user are returned.
  async list() {
    let userid = this.userid;
    let snapshot = await this.database.ref('files/' + userid).once('value');
    return snapshot.val();
  }

  // Create a new file with the specified name and content for the current user.
  // Returns a Promise that resolves to undefined when done.
  // Error if the named file exists.
  async create(filename, content) {
    let userid = this.userid;
    let dbref = this.database.ref('files').child(userid).child(filename);

    let transactionResult = await dbref.transaction(function(existingValue) {
      console.log("existing value", existingValue);

      // If there is already a record here, then a file by this name
      // already exists, so we return undefined to abort the transaction
      if (existingValue) {
        return;
      }

      // Otherwise, return the metadata we want associated with the file
      return {
        size: content.length,
        date: firebase.database.ServerValue.TIMESTAMP,
        'public': false
      }
    });

    if (!transactionResult.committed) {
      // If the transaction was aborted, fail with an error
      //throw new Error('A file named `' + filename + '` already exists');
      throw new Filesystem.FileExists();
    }

    // The filename was unique so save the actual file now
    let storageref = this.storage.ref('u').child(userid).child(filename);
    await storageref.putString(content, firebase.storage.StringFormat.RAW, {
      contentType: 'text/plain',
      customMetadata: { 'public': 'false' }
    });
  }

  // Delete the current user's named file
  async remove(filename) {
    let userid = this.userid;
    let dbref = this.database.ref('files').child(userid).child(filename);
    let storageref = this.storage.ref('u').child(userid).child(filename);

    // Verify that the file exists first
    await this.exists(filename)

    // Remove the file from the database and from storage.
    await Promise.all([dbref.remove(), storageref.delete()]);
  }

  // Rename one of the current user's files
  // XXX
  // Punting on this for now. Can always implement it as a copy+delete
  // instead of a true rename. Or a copy + reset mod time + delete
  // if I want to do it without altering the modification time of the file.
  // Also note that we have to copy the shared status of the file
  async rename(oldname, newname) {
    throw new Error("NYI");
  }

  // Save the specified content to the file with the specified name
  async save(filename, content) {
    let userid = this.userid;
    let dbref = this.database.ref('files').child(userid).child(filename);
    let storageref = this.storage.ref('u').child(userid).child(filename);

    // Find out of this file is public or not, since we need to set that
    // in the storage metadata
    let snapshot = await dbref.child('public').once('value');
    if (!snapshot.exists()) {
      // If the file does not already exist, then the query above should fail.
      throw new Error('No such file: ' + filename);
    }

    let isPublic = snapshot.val()

    await Promise.all([
      // Each time we call putString() we're apparently creating a new file.
      // So it is necessary to set the metadata each time we do this.
      // Omitting it or just passing {} means we end up with empty metadata
      // on the new file.
      storageref.putString(content,
                           firebase.storage.StringFormat.RAW,
                           {
                             contentType: 'text/plain',
                             customMetadata: {
                               'public': isPublic ? 'true' : 'false'
                             }
                           }),
      dbref.update({
        size: content.length,
        date: firebase.database.ServerValue.TIMESTAMP,
        'public': isPublic
      })
    ]);
  }

  // Share or unshare the current user's specified file. If the second
  // argument is true (the default) make the file public. If false,
  // make it private.
  async share(filename, isPublic=true) {
    let userid = this.userid;
    let dbref = this.database.ref('files').child(userid).child(filename);
    let storageref = this.storage.ref('u').child(userid).child(filename);
    isPublic = !!isPublic;

    await this.exists(filename)

    await Promise.all([
      dbref.update({ 'public': isPublic}),  // Share or unshare the db record
      storageref.updateMetadata({           // Share or unshare the file itself
        customMetadata: {
          'public': isPublic ? 'true' : 'false'
        }
      })
    ]);
  }

  // Verify the existance of the named file.
  // Throws/rejects if it does not exist.
  async exists(filename) {
    let userid = this.userid;
    let dbref = this.database.ref('files').child(userid).child(filename);
    let snapshot = await dbref.once('value');
    if (!snapshot.exists()) {
      throw new Error('No such file: ' + filename);
    }
  }

/*
    // XXX
    // If the file does not exist, both of these will fail for different
    // reasons, and we end up with a 'permission denied' error which isn't
    // really informative. I should catch that and throw a not found error.
    // Or I should actually verify existance before doing this await.
    // (If the data is cached, this might actually be quick to verify)
    //
    // Also, the permission denied might only be because of the
    // .validate rules, and if that was removed it might succeed silently
    //
    // Also, apparently I shouldn't mix update() with transaction() as
    // used in create. So maybe do a transaction() here? That could be
    // the verifying existance step
    //
    // Do I need to take similar precautions for other methods?
    // The save method also does an update, and also checks for existance.
    // Change that and this one to use a transaction for the check and
    // to avoid the update(). Or, just punt on the transaction since
    // it probably requires an extra roundtrip and it is very unlikely
    // to be a problem given the UI?
    //
    // Weird. The way transactions work in firebase means that the 
    // existing value is always null the first time (a cached value)
    // and then we get the actual value from the server on a second call.
    // So we can use it in create to ensure that the file does not already
    // exist, but not to ensure that it doesn't exist. So, I'm just
    // going to check for existance with a .once call and then use .update()
    //
*/

  // Read the contents of the specified file of the specified user.
  // Only works for files that that user has marked public
  async getPublicFile(username, filename) {
    // Get the userid for this user
    username = username.toLowerCase();
    let result = await this.database.ref('usernames/' + username).once('value');
    let userid = result.val();
    if (!userid) {
      throw new Error('Unknown user');
    }

    // This will only work if this is the current user or the file is public
    try {
      return await this._getFile(userid, filename);
    }
    catch(e) {
      throw new Error('File not found: ' + filename);
    }
  }

  // Make a clone of the specified user's named file and
  // save it with the same name for the current user.
  async clone(username, filename) {
    let content = await this.getPublicFile(username, filename);
    await this.create(filename, content);
  }

}

Filesystem.FileExists = class extends Error {
  constructor(message) { super(message); }
};

Filesystem.FileNotFound = class extends Error {
  constructor(message) { super(message); }
};
