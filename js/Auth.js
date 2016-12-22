"use strict";

/**
 * This class, intended to be a singleton, manages firebase authentication
 * state. The login() method starts the user logon process (see login.html).
 * the logout() method signs the current user out. And getUserName() 
 * returns the username of the current user. An instance of this class
 * dispatches "login" and "logout" events to the Document object when
 * the user signs on or signs off. The event object for a "login" event
 * has the user's name in the detail property
 */
class Auth {
  constructor(firebase) {
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.username = null;
  }

  // This method calls the firebase.auth().onAuthStateChanged() function.
  // It triggers login and logout events when the user signs in or signs out.
  // But it also triggers an initial login or logout event depending on
  // whether the user is currently logged in or not (Firebase can keep users
  // signed in across sessions).
  //
  // Returns a Promise that resolves right after the initial login or logout
  // event is fired. Once the Promise resolves, you can use getUserName()
  // to find out if the user is logged in or not.
  //
  start() {
    return new Promise((resolve, reject) => {
      let resolver = () => {
        document.removeEventListener('login', resolver);
        document.removeEventListener('logout', resolver);
        resolve(this.username);
      }

      document.addEventListener('login', resolver);
      document.addEventListener('logout', resolver);

      this.auth.onAuthStateChanged(this._authStateChanged.bind(this));
    });
  }

  login() { window.open('login.html', 'login_popup', 'width=400,height=500'); }
  logout() { this.auth.signOut(); }

  getUserName() {
    return (this.auth.currentUser) ?  this.username : null;
  }

  _authStateChanged(user) {
    if (user) {
      // If there is a user object, then the user has signed on.
      // We don't report it until there is a username, though.
      // For newly created accounts, the user can be signed in
      // without a username, and we don't want to report that state.
      // Note that have to use on() instead of once() here since we
      // may need to wait for a second event to get the username
      this.database.ref('users').child(user.uid).on('value', (snapshot) => {
        let userdata = snapshot.val();
        if (userdata && userdata.username) {
          // We got a username, so  stop listening for changes
          this.database.ref('users').child(user.uid).off('value');

          // Remember the username
          this.username = userdata.username;

          // And trigger an event now that the user is signed in.
          document.dispatchEvent(new CustomEvent('login',
                                                 { detail: this.username }));
        }
      }, function(error) { console.error("User query error:", error) });
    } else {
      // If there is no user object, then the user has signed out
      this.username = null;
      document.dispatchEvent(new Event('logout'));
    }
  }
}
