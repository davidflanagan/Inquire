// Return a random integer x: 1 <= x <= n
function random(n) {
    return Math.ceil(Math.random() * n);
}

// Return a random number from a normal distribution with mean 0 and
// standard deviation 1.0.
// Code modified from https://github.com/robbrit/randgen by Rob Britton
function randomNormal() {
  var v1, v2, s;
  if (randomNormal.v2 === null) { // if we don't already have a stored value
    do {
      v1 = 2 * Math.random() - 1;
      v2 = 2 * Math.random() - 1;
      s = v1 * v1 + v2 * v2;
    } while (s === 0 || s >= 1);

    s = Math.sqrt(-2 * Math.log(s) / s);
    randomNormal.v2 = v2 * s; // We'll return this one next time
    return v1 * s;
  }
  else {
    v2 = randomNormal.v2;
    randomNormal.v2 = null;
    return v2;
  }
}

// Return an array with n elements, each one the result of invoking f()
function collect(n, f) {
  var a = [];
  for(var i = 0; i < n; i++)
    a.push(f());
  return a;
}

// Return a histogram for the specified data.
// With only one argument, assume that data is an array of non-negative integers
// and return a new array that has indexes from 0 up to the largest
// value in data. The value at each index is the number of times
// the index appears as a value in data.
//
// If there are four arguments, then...
//
function histogram(data, firstBin, lastBin, binWidth) {
  if (firstBin === undefined) {
    var result = [];

    // Count the data
    for(var i = 0; i < data.length; i++) {
      var x = data[i];
      if (result[x]) result[x]++;
      else result[x] = 1;
    }

    // Set any uninitialized values to 0
    for(var i = 0; i < result.length; i++)
      if (result[i] === undefined) result[i] = 0;

    return result;
  }
  else {
    var result = {};
    var numBins = (lastBin - firstBin)/binWidth + 1;
    var bins = new Array(numBins);
    bins.fill(0);

    for(var i = 0; i < data.length; i++) {
      var value = data[i];
      var adjustedValue = (value - firstBin) / binWidth;
      var bin = Math.round(adjustedValue);
      if (bin === bins.length) bin--;
      bins[bin]++;
    }
    return bins;
  }
}

_Plotly_plot_options = {
    displaylogo:false,
    showLink: false,
    modeBarButtons: [
      ['zoom2d', 'pan2d', 'autoScale2d'],
      ['zoomIn2d', 'zoomOut2d']
    ]
  }

function barchart(data, labels) {
  if (!Array.isArray(data)) {
    throw new Error('First barchart() argument must be an array');
  }

  // We want an array of arrays to allow multi-bar charts
  if (!Array.isArray(data[0])) {
    data = [data]
  }

  if (!labels) {
    labels = [];
    for(p in data[0]) labels.push(p);
  }

  var container = document.createElement('div');
  container.className = "chartContainer";
  container.style.width = '500px';
  container.style.height = '400px';

  var traces = data.map((yvalues) => {
    return { x: labels, y: yvalues, type: 'bar', name: yvalues.label || '' }
  })

  Plotly.newPlot(container, traces, {
    width: 500,
    height: 400,
    xaxis: {
      title: labels.label || ''
    },
    yaxis: {
      title: data.length === 1 && data[0].label
        ? data[0].label
        : ''
    }
  }, _Plotly_plot_options);

  return container;
}

function lineplot(xvalues, ...yvalues) {
  var container = document.createElement('div');
  container.className = "chartContainer";
  container.style.width = '500px';
  container.style.height = '400px';

  var traces = yvalues.map((yval) => {
    return { x: xvalues,
             y: yval,
             mode: 'lines+markers',
             name: yval.label || ''
           }
  })

  Plotly.newPlot(container, traces, {
    width: 500,
    height: 400,
    xaxis: {
      title: xvalues.label || ''
    },
    yaxis: {
      title: yvalues.length === 1 && yvalues[0].label
        ? yvalues[0].label
        : ''
    }
  }, _Plotly_plot_options);

  return container;
}

function display(element) {
  if (typeof element === 'string') {
    var paragraph = document.createElement('p');
    paragraph.className = 'output-text';
    paragraph.append(element.trim());
    document.body.append(paragraph);
  }
  else if (typeof element.render === 'function') {
    var container = document.createElement('div');
    container.innerHTML = element.render();
    document.body.append(container);
  }
  else {
    document.body.append(element);
  }
}

function Table(...headers) {
  this.columnHeaders = headers;
  this.columns = collect(headers.length, () => []);
  this.numRows = 0;
}

Table.prototype.addRow = function(...cells) {
  this.columns.forEach((col, i) => col.push(cells[i]));
  this.numRows++;
}

Table.prototype.render = function() {
  s = '<table><tr>';
  this.columnHeaders.forEach(header => s += '<th>' + header + '</th>');
  s += '</tr>';

  for(var row = 0; row < this.numRows; row++) {
    s += '<tr>';
    this.columns.forEach(col => s += '<td>' + col[row] + '</td>');
    s += '</tr>';
  }

  s += '</table>';
  return s;
}
