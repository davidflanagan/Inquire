class UI {
  constructor(app) {
    this.app = app;
    this.auth = app.auth;
    this.fm = app.fm;
    this.renderer = app.renderer;

    // Query the various document elements we need

    // All buttons (and links, etc.) that produce an action
    this.actionButtons = document.querySelectorAll('[data-action]');

    // The buttons that should be diabled if we're not signed in
    this.authRequiredButtons =
      document.querySelectorAll('button[data-auth="required"]');

    // The buttons in the drawer which should close the drawer
    this.drawerButtons =
      document.querySelectorAll('.mdl-layout__drawer [data-action');

    // We need this one to be able to close the drawer
    this.layoutContainer = document.querySelector('.mdl-layout');

    // We show and hide this button as needed
    this.signInButton = document.getElementById('sign-in');

    // We show and hide the username and sign out link as needed
    this.userNameSignOut = document.getElementById('user-name-sign-out');

    // This is where we display the user's name, if they are logged in
    this.userNameLabel = document.getElementById('user-name');

    // We use this element to indicate when we're busy
    this.progressBar = document.getElementById('progress-bar');

    // Where we display the name and shared status of the current inquiry
    this.inquiryName = document.getElementById('inquiry-name');

    // And now, we register event handlers on these elements

    // For all buttons with data-action attribute, call handleAction()
    let actionHandler = this.handleAction.bind(this);
    this.actionButtons.forEach(b => b.addEventListener('click', actionHandler));

    // For all buttons in the drawer, call closeDrawer()
    let closeDrawer = this.closeDrawer.bind(this);
    this.drawerButtons.forEach(b => b.addEventListener('click', closeDrawer));

    // Other parts of this application dispatch high-level events on the
    // Document object. We handle them in the handleEvent() method.
    document.addEventListener('login', this);
    document.addEventListener('logout', this);
    document.addEventListener('inquiry-name-changed', this);
    document.addEventListener('inquiry-shared-status-changed', this);
    document.addEventListener('busy', this);
    document.addEventListener('idle', this);

    // Finally, we want to start off with buttons that require login disabled
    this.authRequiredButtons.forEach(b => b.disabled = true);
  }

  // This is called when any button with a data-action attribute is clicked
  handleAction(e) {
    let action = e.currentTarget.dataset.action;
    switch(action) {
    case 'login':
      this.auth.login();
      break;
    case 'logout':
      this.auth.logout();
      break;
    case 'save':
      this.fm.save();
      break;
    case 'saveas':
      this.fm.saveAs();
      break;
    case 'open':
      this.fm.open();
      break;
    case 'delete':
      this.fm.delete();
      break;
    case 'run':
      this.renderer.render();
      break;
    case 'share':
      this.fm.share(true);
      break;
    case 'unshare':
      this.fm.share(false);
      break;
    case 'new':
    case 'rename':
    default:
      console.warn('Ignoring unknown action', action);
      break;
    }
  }

  // This is called when any button inside the drawer is clicked.
  closeDrawer() {
    this.layoutContainer.MaterialLayout.toggleDrawer();
  }

  // This is called to handle the high-level events fired by other parts
  // of the application.
  handleEvent(e) {
    switch(e.type) {
    case 'login':
      // When we get a login event, it means the user has logged in
      // so hide the sign in button and show the sign out button and username
      this.signInButton.hidden = true;
      this.userNameSignOut.hidden = false;
      this.userNameLabel.textContent = e.detail;

      // Also, enable all the buttons that require login
      this.authRequiredButtons.forEach(b => {
        b.disabled = false;
        b.title = '';
      });
      break;

    case 'logout':
      // When we get a logout event, it means the user has logged out.
      // Hide the username and sign out button and display the sign in button.
      this.signInButton.hidden = false;
      this.userNameSignOut.hidden = true;
      this.userNameLabel.textContent = '';

      // Also, disable all the buttons that require login
      this.authRequiredButtons.forEach(b => {
        b.disabled = true;
        b.title = 'Sign in to use this feature';
      });
      break;

    case 'inquiry-name-changed':
      // After a load or a save-as, we should display the new name
      // of the current inquiry
      this.inquiryName.textContent = e.detail;
      break;

    case 'inquiry-shared-status-changed':
      let label = document.getElementById('inquiry-shared');
      let shareButton = document.querySelector('[data-action="share"]');
      let unshareButton = document.querySelector('[data-action="unshare"]');

      if (e.detail) { // shared
        label.textContent = "shared";
        shareButton.hidden = true;
        unshareButton.hidden = false;
      }
      else {          // private
        label.textContent = "private";
        shareButton.hidden = false;
        unshareButton.hidden = true;
      }
      break;

    case 'busy':
      this.progressBar.classList.add('mdl-progress--indeterminate');
      break;

    case 'idle':
      this.progressBar.classList.remove('mdl-progress--indeterminate');
      break;
    }
  }
}
