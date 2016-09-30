// Return a random integer x: 1 <= x <= n
function random(n) {
    return Math.ceil(Math.random() * n);
}

// Return an array with n elements, each one the result of invoking f()
function collect(n, f) {
  var a = [];
  for(var i = 0; i < n; i++)
    a.push(f());
  return a;
}

// Return a histogram for the specified data.
// Assume that data is an array of non-negative integers
// Return a new array that has indexes from 0 up to the largest
// value in data. The value at each index is the number of times
// the index appears as a value in data.
function histogram(data) {
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

function barchart(data, labels) {
  if (!labels) {
    labels = [];
    for(p in data) labels.push(p);
  }

  var container = document.createElement('div');
  container.className = "chartContainer";

  var chart = new Chartist.Bar(container,
                               {
                                 labels: labels,
                                 series: [ data ]
                               },
                               {
                                 width: "500px",
                                 height: "200px",
                                 axisY: {
                                   onlyInteger: true
                                 }
                               });
  return container;
}

function lineplot(xvalues, ...yvalues) {
  var container = document.createElement('div');
  container.className = "chartContainer";
  new Chartist.Line(container,
                    {
                      labels: xvalues,
                      series: yvalues
                    },
                    {
                      width: "500px",
                      height: "400px",
                      axisX: {
                        labelInterpolationFnc: function(value, index) {
                          return index % 5 === 0 ? value.toPrecision(2) : null;
                        }
                      }
                    });
  return container;
}

function display(element) {
  if (typeof element === 'string') {
    var paragraph = document.createElement('p');
    paragraph.className = 'output-text';
    paragraph.append(element);
    document.body.append(paragraph);
  }
  else {
    document.body.append(element);
  }
}
