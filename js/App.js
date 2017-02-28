class App {
  constructor(firebase) {
    this.firebase = firebase;

    this.auth = new Auth(firebase);
    this.fs = new Filesystem(firebase);

    this.editor = new Editor();
    this.renderer = new Renderer(this);
    this.dialogs = new DialogsUI();
    this.fm = new FileManager(this);
    this.ui = new UI(this);

    window.addEventListener('hashchange', e => this.handleHashChange());
  }

  handleHashChange() {
    console.log('hashchange', window.location.hash)
  }
}

let app = new App(firebase);
app.auth.start().then(username => app.handleHashChange());



