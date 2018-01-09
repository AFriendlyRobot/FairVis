var data; 
// Side of grid in histograms and correctness matrices.
var SIDE = 7;

// Component dimensions.
var HEIGHT = 250;
var HISTOGRAM_WIDTH = 370;
var HISTOGRAM_LEGEND_HEIGHT = 60;

// Histogram bucket width
var HISTOGRAM_BUCKET_SIZE = 0.1;

// Padding on left; needed within SVG so annotations show up.
var LEFT_PAD = 10;

// Colors of categories of items.
var CATEGORY_COLORS = ['#039', '#c70'];


function draw_histogram() {
	//histogram_initialize();
	histogram_main(); 
}


function histogram_initialize() {
	data = json.dataPoints;
	var colNames = json.colNames;
	var modelNames = Object.keys(data[0].predictions);

	// populate options for protected field selection
	var newOpts
	for (var i = 0; i < colNames.length - 1; i++) {
		newOpt  = "<option class=\"protectedSelectOption\" value=\"";
		newOpt += colNames[i];
		newOpt += "\">" + colNames[i];
		newOpt += "</option>";
		$("#protectedSelection").append(newOpt);
	}
	$("#protectedSelection").val(colNames[0]);

	// populate options for model selector
	// populate options for model selector
	var newOpts
	for (var i = 0; i < modelNames.length; i++) {
		newOpt  = "<option class=\"modelSelectOption\" value=\"";
		newOpt += modelNames[i];
		newOpt += "\">" + modelNames[i];
		newOpt += "</option>";
		$("#modelSelection").append(newOpt);
	}
	$("#modelSelection").val(modelNames[0]);

	populate_groups();

	$("#protectedSelection").on("change", function() {
		// clear previous options
		$("#group1Selection").empty();
		$("#group2Selection").empty();

		// populate the two sub selectors
		populate_groups();
	});
}

function histogram_main() { 
	var tprValue = 300;
 	var fprValue = -700;

	var groups = makeItemsFor2Groups($("#protectedSelection").val(), $("#group1Selection").val(), 
		$("#group2Selection").val(), $("#modelSelection").val());

	var comparisonExample0 = new GroupModel(groups[0], tprValue, fprValue);
	var comparisonExample1 = new GroupModel(groups[1], tprValue, fprValue);

	var optimizer = Optimizer(comparisonExample0, comparisonExample1, 1); 

	// to switch among definitions
	document.getElementById('statistical-parity').onclick = optimizer.statisticalParity; 
	document.getElementById('conditional-statistical-parity').onclick = optimizer.conditionalStatisticalParity; 
	document.getElementById('predictive-equality').onclick = optimizer.predictiveEquality; 
	document.getElementById('predictive-parity').onclick = optimizer.predictiveParity; 
	document.getElementById('error-rate-balance').onclick = optimizer.errorRateBalance; 

	// TODO: make correctness matrices?

	// TODO: create pie charts? 

	// make histograms & legends
	createHistogram('histogram0', comparisonExample0, false, true);
	createHistogram('histogram1', comparisonExample1, false, true);
	createHistogramLegend('histogram-legend0', 0);
	createHistogramLegend('histogram-legend1', 1);

	// TODO: update micro-story annotations for each definition 
}

function createHistogram(id, model, noThreshold, includeAnnotation) {
	var width = HISTOGRAM_WIDTH;
	var height = HEIGHT;
	var bottom = height - 16;

	// Create an internal copy.
	var items = copyItems(model.items);

	// Icons
	// var numBuckets = 1 / HISTOGRAM_BUCKET_SIZE;
	var numBuckets = 20;
	var pedestalWidth = numBuckets * SIDE;
	var hx = (width - pedestalWidth) / 2;
	var scale = d3.scaleLinear().range([hx, hx + pedestalWidth]).
	domain([0, 1]);

	function histogramLayout(items, x, y, side, low, high, bucketSize) {
		var buckets = [];
		var maxNum = Math.floor((high - low) / bucketSize);
		items.forEach(function(item) {
			var bn = Math.floor((item.score - low) / bucketSize);
			bn = Math.max(0, Math.min(maxNum, bn));
			buckets[bn] = 1 + (buckets[bn] || 0);
			item.x = x + side * bn;
			item.y = y - side * buckets[bn];
			item.side = side;
		});
	}

	histogramLayout(items, hx, bottom, SIDE, 0, 100, HISTOGRAM_BUCKET_SIZE);
	var svg = createIcons(id, items, width, height);

	var tx = width / 2;
	var topY = 60;
	// var axis = d3.axisBottom(scale);
    var axis = d3.axisBottom(scale);
	svg.append('g').attr('class', 'histogram-axis')
	.attr('transform', 'translate(0,-8)')
	.call(axis);
	d3.select('.domain').attr('stroke-width', 1);

	if (noThreshold) {
		return;
	}
	// Sliding threshold bar.
	var cutoff = svg.append('rect').attr('x', tx - 2).attr('y', topY - 10).
	attr('width', 3).attr('height', height - topY);

	var thresholdLabel = svg.append('text').text('threshold: 0.5')
	.attr('x', tx)
	.attr('y', 40)
	.attr('text-anchor', 'middle').attr('class', 'bold-label');

	if (includeAnnotation) {
		var annotationPad = 10;
		var annotationW = 200;
		var thresholdAnnotation = svg.append('rect')
		.attr('class', 'annotation group-unaware-annotation')
		.attr('x', tx - annotationW / 2)
		.attr('y', 30 - annotationPad)
		.attr('rx', 20)
		.attr('ry', 20)
		.attr('width', annotationW)
		.attr('height', 30);
	}

	function setThreshold(t, eventFromUser) {
		t = Math.max(0, Math.min(t, 100));
		if (eventFromUser) {
			t = HISTOGRAM_BUCKET_SIZE * Math.round(t / HISTOGRAM_BUCKET_SIZE);
		} else {
			tx = Math.round(scale(t));
		}
		tx = Math.max(0, Math.min(width - 4, tx));
		var rounded = SIDE * Math.round(tx / SIDE);
		cutoff.attr('x', rounded);
		var labelX = Math.max(50, Math.min(rounded, width - 70));
		thresholdLabel.attr('x', labelX).text('threshold: ' + t);
		if (includeAnnotation) {
			thresholdAnnotation.attr('x', tx - annotationW / 2);
		}
		svg.selectAll('.icon').call(defineIcon);
	}
	var drag = d3.drag()
	.on('drag', function() {
		var oldTx = tx;
		tx += d3.event.dx;
		var t = scale.invert(tx);
		setThreshold(t, true);
		if (tx != oldTx) {
			console.log(t);
			model.classify(t);
			model.notifyListeners('histogram-drag');
		}
	});
	svg.call(drag);
	model.addListener(function(event) {
		for (var i = 0; i < items.length; i++) {
			items[i].predicted = items[i].score >= model.threshold ? 1 : 0;
		}
		setThreshold(model.threshold, event == 'histogram-drag');
	});
}

function createHistogramLegend(id, category) {
  var width = HISTOGRAM_WIDTH;
  var height = HISTOGRAM_LEGEND_HEIGHT;
  var centerX = width / 2;
  var boxSide = 16;
  var centerPad = 1;

  // Create SVG.
  var svg = d3.select('#' + id).append('svg')
    .attr('width', width)
    .attr('height', height);

  // Create boxes.
  svg.append('rect').attr('width', boxSide).attr('height', boxSide)
    .attr('x', centerX - boxSide - centerPad).attr('y', boxSide)
    .attr('fill', itemColor(category, 0))
    .attr('fill-opacity', itemOpacity(1));
  svg.append('rect').attr('width', boxSide).attr('height', boxSide)
    .attr('x', centerX + centerPad).attr('y', boxSide)
    .attr('fill', itemColor(category, 1))
    .attr('fill-opacity', itemOpacity(1));

  svg.append('rect').attr('width', boxSide).attr('height', boxSide)
    .attr('x', centerX - boxSide - centerPad).attr('y', 0)
    .attr('fill', itemColor(category, 0))
    .attr('fill-opacity', itemOpacity(0));
  svg.append('rect').attr('width', boxSide).attr('height', boxSide)
    .attr('x', centerX + centerPad).attr('y', 0)
    .attr('fill', itemColor(category, 1))
    .attr('fill-opacity', itemOpacity(0));

  // Draw text.
  var textPad = 4;
  svg.append('text')
      .text('false negative')
      .attr('x', centerX - boxSide - textPad)
      .attr('y', 2 * boxSide - textPad)
      .attr('text-anchor', 'end')
      .attr('class', 'legend-label');
  svg.append('text')
      .text('true negative')
      .attr('x', centerX - boxSide - textPad)
      .attr('y', boxSide - textPad)
      .attr('text-anchor', 'end')
      .attr('class', 'legend-label');
  svg.append('text')
      .text('true positive')
      .attr('x', centerX + boxSide + textPad)
      .attr('y', 2 * boxSide - textPad)
      .attr('text-anchor', 'start')
      .attr('class', 'legend-label');
  svg.append('text')
      .text('false positive')
      .attr('x', centerX + boxSide + textPad)
      .attr('y', boxSide - textPad)
      .attr('text-anchor', 'start')
      .attr('class', 'legend-label');

}


function Optimizer(model0, model1, stepSize) {
	// see maximizeWithConstraint()
	function updateViz(event) {

	}

	return {
		statisticalParity: function() {
				
			
		}, 
		conditionalStatisticalParity: function() {

			
		}, 
		predictiveEquality: function() {
			
			

		},
		predictiveParity: function() {

			

		},
		errorRateBalance: function() {

			

		}
	};
}

// an item = a datapoint 
var Item = function(category, value, score) {
  // real class
  this.category = category;
  // intrinsic value
  this.value = value;
  // predicted class 
  this.predicted = value;
  // prediction score 
  this.score = score;
};

var GroupModel = function(items, tprValue, fprValue) {
	this.items = items; 
	this.tprValue = tprValue;
	this.fprValue = fprValue; 
	this.listeners = []; 
};

// classify each datapoint with threshold
GroupModel.prototype.classify = function(threshold) {
	this.threshold = threshold; 

	// classify and find positive rates 
	var totalPos = 0; 
	var totalPredictedPos = 0; 
	var totalPosPredictedPos = 0; 

	this.items.forEach(function(item) {
		item.predicted = item.score >= threshold ? 1 : 0; 
	});
	this.tpr = tpr(this.items); 
	this.positiveRate = postiveRate22(this.items);
};

// GroupModels follow a very simple observer pattern; they
// have listeners which can be notified of arbitrary events.
GroupModel.prototype.addListener = function(listener) {
  this.listeners.push(listener);
};

// Tell all listeners of the specified event.
GroupModel.prototype.notifyListeners = function(event) {
  this.listeners.forEach(function(listener) {listener(event);});
};

function makeItemsFor2Groups(fieldName, groupName1, groupName2, modelName) {
	var group1 = []; 
	var group2 = [];

	data.forEach(function(d) {
		if (d.data[fieldName].toString() == groupName1) {
			group1.push(new Item(1, -111, d.predictions[modelName])); 
		} else if (d.data[fieldName].toString() == groupName2) {
			group2.push(new Item(2, -111, d.predictions[modelName]));
		}
	});

	return [group1, group2];
}


// helper functions 
function tpr(items) {
  var totalPos = 0;
  var totalPosPredictedPos = 0;
  items.forEach(function(item) {
    totalPos += item.value;
    totalPosPredictedPos += item.value * item.predicted;
  });
  if (totalPos == 0) {
    return 1;
  }
  return totalPosPredictedPos / totalPos;
}

// Calculate overall positive rate
function positiveRate22(items) {
  var totalPos = 0;
  items.forEach(function(item) {
    totalPos += item.predicted;
  });
  return totalPos / items.length;
}

function getGroupOptions(colName) {
	var opts = []; 
	// get index of group 
	// var indexOfCol = json.colNames.indexOf(colName);
	// console.log(indexOfCol);

	data.forEach(function(d) {
		if(!opts.includes(d.data[colName])) {
			opts.push(d.data[colName]); 
		}
	});
	return opts;
}

function getModelNames() {
	var models = [];

	data[0].predictions.forEach(function(k, v) {
		models.push(k); 
	})
	return models;
}

function populate_groups() {
	var options = getGroupOptions($("#protectedSelection").val());
	var newOpts
	for (var i = 0; i < options.length; i++) {
		newOpt  = "<option class=\"groupSelectOption\" value=\"";
		newOpt += options[i];
		newOpt += "\">" + options[i];
		newOpt += "</option>";
		$("#group1Selection").append(newOpt);
		$("#group2Selection").append(newOpt);
	}

	$("#group1Selection").val(options[0]);
	$("#group2Selection").val(options[1]);
}

function itemColor(category, predicted) {
  return predicted == 0 ? '#555' : CATEGORY_COLORS[category];
}

function itemOpacity(value) {
  return .3 + .7 * value;
}

function iconColor(d) {
  return d.predicted == 0 && !d.colored ? '#555' : CATEGORY_COLORS[d.category];
}

function iconOpacity(d) {
  return itemOpacity(d.value);
}

// Icon for a person in histogram or correctness matrix.
function defineIcon(selection) {
  selection
    .attr('class', 'icon')
    .attr('stroke', iconColor)
    .attr('fill', iconColor)
    .attr('fill-opacity', iconOpacity)
    .attr('stroke-opacity', function(d) {return .4 + .6 * d.value;})
    .attr('cx', function(d) {return d.x + d.side / 2;})
    .attr('cy', function(d) {return d.y + d.side / 2;})
    .attr('r', function(d) {return d.side * .4});
}

function createIcons(id, items, width, height, pad) {
  var svg = d3.select('#' + id).append('svg')
    .attr('width', width)
    .attr('height', height);
  if (pad) {
    svg = svg.append('g').attr('transform', 'translate(' + pad + ',0)');
  }
  var icon = svg.selectAll('.icon')
    .data(items)
  .enter().append('circle')
    .call(defineIcon);
  return svg;
}

function gridLayout(items, x, y) {
  items = items.reverse();
  var n = items.length;
  var cols = 15;
  var rows = Math.ceil(n / cols);
  items.forEach(function(item, i) {
    item.x = x + SIDE * (i % cols);
    item.y = y + SIDE * Math.floor(i / cols);
    item.side = SIDE;
  });
}

// Shallow copy of item array.
function copyItems(items) {
  return items.map(function(item) {
    var copy = new Item(item.category, item.value, item.score);
    copy.predicted = item.predicted;
    return copy;
  });
}
