class Editor {
  constructor() {
    this.container = document.getElementById('input');
    this.cm = CodeMirror(this.container, {
      lineNumbers: true,
      lineWrapping: true,
      autofocus: true,
    });
    this.doc = this.cm.getDoc();
    this.markSaved();
  }

  getText() {
    return this.doc.getValue();
  }

  setText(s) {
    this.doc.setValue(s)
  }

  markSaved() {
    this.savedGeneration = this.doc.changeGeneration();
  }

  isSaved() {
    return this.doc.isClean(this.savedGeneration);
  }
}
