var run = document.getElementById('run');
var input = document.getElementById('input');
var output = document.getElementById('output');

// This is how we begin each generated iframe document
var outputPrefix = `<html>
<head>
<meta charset="utf-8" />
<title>INQUIRY</title>
<link href="inquiry.css" rel="stylesheet">
<link href="lib/chartist.css" rel="stylesheet">
<script src="lib/chartist.js"></script>
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
  return outputPrefix + marked(input, { renderer: renderer }) + outputSuffix;
}


run.onclick = function() {
  output.srcdoc = render(input.value);
/*
  if (output.hidden) {
    output.srcdoc = render(input.value);
    input.hidden = true;
    output.hidden = false;
    button.textContent = 'Edit';
  }
  else {
    output.hidden = true;
    input.hidden = false;
    output.srcdoc = '';
    button.textContent = 'Run';
  }
*/
};
