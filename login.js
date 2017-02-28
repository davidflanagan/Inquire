window.onload = initLoginCard;

function initLoginCard() {
  // FirebaseUI config.
  var uiConfig = {
    // Url to redirect to after a successful sign-in.
    signInSuccessUrl: '/',
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    'callbacks': {
      'signInSuccess': function(user, credential, redirectUrl) {
        getUsername(user.uid).then(username => {
          if (username) {
            // If we already have a username, we're done
            done();
          }
          else {
            // If we don't have a username, then unhide the UI for creating one
            document.getElementById('logincard').hidden = true;
            document.getElementById('usernamecard').hidden = false;
            initUsernameCard();
          }
        });
        return false;
      }
    },
    'signInOptions': [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      firebase.auth.GithubAuthProvider.PROVIDER_ID,
      // firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ]
  };

  // Initialize the FirebaseUI Widget using Firebase.
  var ui = new firebaseui.auth.AuthUI(firebase.auth());

  // The start method will wait until the DOM is loaded to include the
  // FirebaseUI sign-in widget within the element corresponding to the
  // selector specified.
  ui.start('#firebaseui-auth-container', uiConfig);
}

function initUsernameCard() {
  // Shortcuts to Firebase SDK features.
  var auth = firebase.auth();
  var database = firebase.database();

  // DOM elements we need
  var username_input = document.getElementById('username');
  var username_error = document.getElementById('username-error');
  var set_button = document.getElementById('setusername');

  // The uid that we get from onAuthStateChanged
  var uid = null;

  set_button.onclick = selectUsername;
  username_input.oninput = validateUsername;

  function validateUsername() {
    var text = username_input.value;
    var error = "";

    if (!text.match(/^[a-zA-Z0-9_-]+$/)) {
      error = 'Letters and numbers only; no spaces or punctuation';
    }
    else if (text.length < 3) {
      error = 'Username must be at least 3 characters';
    }
    else if (text.length > 20) {
      error = 'Username must be 20 characters or less.';
    }

    // Have to delay this or the is-invalid class is not set correctly
    setTimeout(function() { showValidationError(error); });
  }

  function showValidationError(error) {
    username_error.textContent = error;

    if (error) {
      username_input.parentElement.classList.add('is-invalid');
      set_button.disabled = true;
    }
    else {
      username_input.parentElement.classList.remove('is-invalid');
      set_button.disabled = false;
    }
  }

  function selectUsername() {
    var user = firebase.auth().currentUser;
    if (!user)
      return;

    username = username_input.value;

    setUsername(user.uid, username)
      .then(done)
      .catch((error) => {
        showValidationError('That username is already in use. Please select another');
      });
  }
}

function getUsername(uid) {
  return firebase.database().ref('users/' + uid).once('value')
    .then(snapshot => {
      var value = snapshot.val();
      return value && value.username;
    });
}

function setUsername(uid, username) {
  var db = firebase.database();
  return db.ref('usernames').child(username.toLowerCase()).set(uid)
    .then(() => {
      return db.ref('users').child(uid).set({ username: username });
    });
}

function done() {
  if (window.opener)       // If we're in a popup
    window.close()         // Just close it
  else
    window.location = '/'  // Otherwise, return to the main page
}
