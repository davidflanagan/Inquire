// XXX This should perhaps also handle caching work to localStorage?

class FileManager {
  constructor(app) {
    this.app = app;
    this.auth = app.auth;
    this.fs = app.fs;
    this.dialogs = app.dialogs;
    this.editor = app.editor;
    this.filename = null;
    this.inquiryShared = null;
  }

  _verifyAuth(message) {
    if (!this.auth.getUserName()) {
      this.dialogs.notify(message);
      throw new Error('Must be logged in.');
    }
  }

  async save() {
    // This shouldn't happen, since the Save button should be disabled
    // if the user is not logged in
    this._verifyAuth('You must sign in in order to save inquiries');

    // If we don't already have a filename, treat this as a Save As...
    if (!this.filename) {
      await this.saveAs();
      return;
    }

    let content = this.editor.getText();
    try {
      document.dispatchEvent(new Event('busy'));
      await this.fs.save(this.filename, content);
      document.dispatchEvent(new Event('idle'));
      this.dialogs.notify('Inquiry saved: ' + this.filename);
    }
    catch(e) {
      document.dispatchEvent(new Event('idle'));
      // XXX I should probably have different types of error classes
      // for different errors.
      if (e.message.startsWith('No such file:')) {
        var create = await this.dialogs.confirm('No such file',
                                          'No inquiry by that name exists. ' +
                                          'Do you want to create it.',
                                          'Create', 'Cancel');
        if (create) {
          await this.fs.create(this.filename, content);
          this.dialogs.notify('Inquiry created: ' + this.filename);
        }
        else {
          this.dialogs.notify('Inquiry not saved.');
        }
      }
      else {
        console.log(e);
        this.dialogs.notify("Unknown error; inquiry not saved.");
      }
    }
  }

  async saveAs() {
    // This shouldn't happen, since the Save As button should be
    // disabled if the user is not logged in
    this._verifyAuth('You must sign in in order to save inquiries');

    let filename =
        await this.dialogs.prompt('Save as',
                                  'Please enter a name for this inquiry',
                                  'inquiry name',
                                  '^[a-zA-Z0-9 _-]{1,20}$',
                                  'Up to 20 characters; no punctuation allowed',
                                  'Save');

    if (!filename) {  // If the user cancelled or entered the empty string
      return;
    }

    let content = this.editor.getText();

    try {
      await this.fs.create(filename, content)
      this.dialogs.notify('Inquiry saved as: ' + filename);
      this.setInquiryName(filename);
      this.setSharedStatus(false);
    }
    catch(e) {
      if (e instanceof Filesystem.FileExists) {
        let replace =  await this.dialogs.confirm('File exists',
                                                  'An inquiry by that name already exists.' +
                                                  ' Would you like to replace it?',
                                                  'Replace', 'Cancel');
        if (replace) {
          await this.fs.save(filename, content);
          this.dialogs.notify('Inquiry replaced: ' + filename);
          this.setInquiryName(filename);
          this.setSharedStatus(false);
        }
        else {
          this.dialogs.notify('Inquiry not saved.');
          return;
        }
      }
      else {
        console.error(e)
        this.dialogs.alert('Unknown error: file not saved.',
                           e.message);
      }
    }

  }

  async open() {
    // This shouldn't happen, since the Open button should be
    // disabled if the user is not logged in
    this._verifyAuth('You must sign in in order to access your inquiries');

    let files = await this.fs.list();
    let filename = await this.dialogs.open(files);
    if (filename) {
      await this.load(filename);
    }
  }

  async load(filename) {
    document.dispatchEvent(new Event('busy'));
    let content = await this.fs.getFile(filename);
    this.editor.setText(content);
    this.setInquiryName(filename);
    let isShared = await this.fs.isShared(filename);
    this.setSharedStatus(isShared);
    document.dispatchEvent(new Event('idle'));
  }

  async delete() {
    // This shouldn't happen, since the Delete button should be
    // disabled if the user is not logged in
    this._verifyAuth('You must sign in in order to access your inquiries');

    let files = await this.fs.list();
    let filenames = await this.dialogs.delete(files);

    if (!filenames) {  // This means the dialog was cancelled
      return;
    }

    if (filenames.length === 0) { // Not cancelled but nothing selected
      this.dialogs.notify('No inquiries selected for deletion.');
      return;
    }

    let query = (filenames.length === 1)
        ? `Really delete '${filenames[0]}'?`
        : `Really delete ${filenames.length} inquiries?`;

    var really = await this.dialogs.confirm('Confirm delete',
                                            query + '\nThis cannot be undone.',
                                            'Delete');
    if (!really) {
      this.dialogs.notify('Deletion cancelled.');
      return;
    }

    document.dispatchEvent(new Event('busy'));
    try {
      await Promise.all(filenames.map(f => this.fs.remove(f)));
      this.dialogs.notify('Deletion complete');
    }
    catch(e) {
      this.dialogs.notify('Deletion failed for one or more inquiries: ' +
                          e.message);
      console.error('Deletion failed: ', e);
    }
    document.dispatchEvent(new Event('idle'));
  }

  // XXX:
  // This is an operation that should only be allowed when the user is
  // viewing an inquiry that they own. It isn't enough to be logged in.
  // If viewing someone else's shared inquiry, the buttons shouldn't appear.
  // I need to take care of that in the UI, but should also catch
  // whatever the relevant exceptions are here and give appropriate
  // notifications.
  //
  async share(shared) {
    // If we're already in the desired state, there is nothing to do
    // Our UI shouldn't allow this to happen, unless maybe there are
    // multiple tabs open or something.
    if (shared === this.inquiryShared) {
      let status = shared ? 'shared' : 'private';
      this.dialogs.alert('Already ' + status,  
                         this.filename + ' is already ' + status);
      return;
    }

    let really;
    if (shared) {
      really = await this.dialogs.confirm('Really share?',
                           'Do you want to share this inquiry with everyone?',
                           'Share', 'Cancel');
    }
    else {
      really = await this.dialogs.confirm('Really unshare?',
                              'Do you want to make this inquiry private?' +
                              '\nIf you have previously shared it with others' +
                              ' they will no longer be able to see it.',
                              'Make private', 'Cancel');
    }

    if (really) {
      await this.fs.share(this.filename, shared)
      this.setSharedStatus(shared);
      this.dialogs.notify(shared ? 'Inquiry shared' : 'Inquiry made private');
    }
    else {
      this.dialogs.notify('Operation cancelled');
    }
  }

  setInquiryName(filename) {
    this.filename = filename;
    document.dispatchEvent(new CustomEvent('inquiry-name-changed', {
      detail: filename
    }));
  }

  setSharedStatus(isShared) {
    if (this.inquiryShared !== isShared) {
      this.inquiryShared = isShared;
      document.dispatchEvent(new CustomEvent('inquiry-shared-status-changed', {
        detail: isShared
      }));
    }
  }

}
