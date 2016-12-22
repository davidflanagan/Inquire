class Renderer {
  constructor(app) {
    this.editor = app.editor;
    this.output = document.getElementById('output');
    // This object translates markdown to html
    this.renderer = new marked.Renderer();
    // We customize the renderer to display code and also put it in a 
    // script tag to run it.
    this.renderer.code = this.renderCode;
  }

  // Instead of just displaying code blocks, we also execute them
  renderCode(code, language) {
    var escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // XXX:
    // I should insert an anchor on each line of displayed code mapping it
    // to code line numbers so that on errors I can highlight the right line.
    // We want to be able to map line numbers in the srcdoc (output HTML) to
    // where in the srcdoc those lines are displayed and also where they are
    // in the input doc

    return '<pre><code>' + escapedCode + '</code></pre>\n' +
      '<script>\n' + code + '\n</script>';
  }

  render() {
    let markdown = this.editor.getText();
    let html = Renderer.outputPrefix +
        marked(markdown, { renderer: this.renderer }) +
        Renderer.outputSuffix;

    // We can't use srcdoc to specify the iframe because of this Firefox SVG bug
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1319586
    // output.srcdoc = out;
    this.output.contentDocument.write(html);
    this.output.contentDocument.close();
  }
}

// This is how we begin each generated iframe document
Renderer.outputPrefix = `<html>
<head>
<meta charset="utf-8" />
<title>INQUIRY</title>
<link href="environment/css/inquiry.css" rel="stylesheet">
<script src="environment/lib/plotly-basic.js"></script>
<script src="environment/js/library.js"></script>
</head>
<body>`;

// This is how we end the iframe documents
Renderer.outputSuffix = '\n</body></html>';
