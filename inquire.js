var run = document.getElementById('run');
var input = document.getElementById('input');
var output = document.getElementById('output');

// This is how we begin each generated iframe document
var outputPrefix = `<html>
<head>
<meta charset="utf-8" />
<title>INQUIRY</title>
<link href="inquiry.css" rel="stylesheet">
<script src="lib/plotly-basic.js"></script>
<script src="library.js"></script>
</head>
<body>`;

// This is how we end the iframe documents
var outputSuffix = '\n</body></html>';

// This custom marked renderer displays code and puts it in a script tag
// to run it.
var renderer = new marked.Renderer();
renderer.code = function(code, language) {
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

function render(input) {
  var out = outputPrefix + marked(input, { renderer: renderer }) + outputSuffix;

  // We can't use srcdoc to specify the iframe because of this Firefox SVG bug
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1319586
  // output.srcdoc = out;
  output.contentDocument.write(out);
  output.contentDocument.close();
}

run.onclick = function() {
  render(input.value)
};

window.addEventListener('load', function() {
  var search = window.location.search;
  if (search.startsWith('?url=')) {
    var url = search.substring(5);
    fetch(url)
      .then(response => response.text())
      .then(text => {
        input.value = text;
        render(text);
      });
  }
});
