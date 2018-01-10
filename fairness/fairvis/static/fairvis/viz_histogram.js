var data; 
var thresholdGlobal;
var scalar; 
var barData; 

// Side of grid in histograms and correctness matrices.
var SIDE = 110;

var POSITIVE = 1; 
var NEGATIVE = 0;
var TRUE_POSITIVE = "TF"; 
var TRUE_NEGATIVE = "TN";
var FALSE_POSITIVE = "FP";
var FALSE_NEGATIVE = "FN";

// Component dimensions.
var HEIGHT = 500;
var HISTOGRAM_HEIGHT = HEIGHT - 16;
var HISTOGRAM_WIDTH = 370;
var HISTOGRAM_LEGEND_HEIGHT = 60;

// Histogram bucket width
var HISTOGRAM_BUCKET_SIZE = 0.04;
var NUM_BUCKETS = 1 / HISTOGRAM_BUCKET_SIZE;
var BAR_WIDTH = (HISTOGRAM_WIDTH - 20) / NUM_BUCKETS;

// Padding on left; needed within SVG so annotations show up.
var LEFT_PAD = 10;

// Colors of categories of items.
var CATEGORY_COLORS = ['#039', '#c70'];


function draw_histogram() {
	$("#histogram0").empty();
	$("#histogram1").empty();
	$("#histogram-legend0").empty();
	$("#histogram-legend1").empty();
	thresholdGlobal = 0.5;
	scalar = null;
	barData = [[], []];
	histogram_main(); 
}

function histogram_initialize() {
	data = json.dataPoints;
	var colNames = json.colNames;
	var modelNames = Object.keys(data[0].scores);

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

	// TODO: change this
	var fairnessDef0 = new GroupModel(groups[1], tprValue, fprValue);
	var fairnessDef1 = new GroupModel(groups[1], tprValue, fprValue);
	var optimizer = Optimizer(fairnessDef0, fairnessDef1, 1); 

	// to switch among definitions
	document.getElementById('statistical-parity').onclick = optimizer.statisticalParity; 
	document.getElementById('conditional-statistical-parity').onclick = optimizer.conditionalStatisticalParity; 
	document.getElementById('predictive-equality').onclick = optimizer.predictiveEquality; 
	document.getElementById('predictive-parity').onclick = optimizer.predictiveParity; 
	document.getElementById('error-rate-balance').onclick = optimizer.errorRateBalance; 

	// TODO: make correctness matrices?

	// TODO: create pie charts? 

	// make histograms & legends
	createHistogram('histogram0', comparisonExample0, false, false);
	createHistogram('histogram1', comparisonExample1, false, false);
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
	//var numBuckets = 20;
	var SIDE = (HISTOGRAM_WIDTH - 20) / NUM_BUCKETS;
	var pedestalWidth = NUM_BUCKETS * SIDE;
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

	histogramLayout(items, hx, bottom, SIDE, 0.0, 1.0, HISTOGRAM_BUCKET_SIZE);
	//var svg = createIcons(id, items, width, height);
	var svg = createBars(id, items, width, height, thresholdGlobal);

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

	// ignore this part (currently not used)
	if (includeAnnotation) {
		var annotationPad = 10;
		var annotationW = 200;
		var thresholdAnnotation = null;
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
		svg.selectAll('.bar').call(defineBar);
	}
	var drag = d3.drag()
	.on('drag', function() {
		var oldTx = tx;
		tx += d3.event.dx;
		var t = scale.invert(tx);
		thresholdGlobal = t;
		setThreshold(t, true);
		if (tx != oldTx) {
			model.classify(t);
			model.notifyListeners('histogram-drag');
		}
	});
	svg.call(drag);
	model.addListener(function(event) {
		// update bars
		var groupID = items[0].category;
		var thisBarData = barData[groupID]; 
		for (var i = 0; i < thisBarData.length; i++) {
			thisBarData[i].predicted = thisBarData[i].flooredScore >= model.threshold ? 1 : 0;
		}
		barData[groupID] = thisBarData;

		// update items 
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
var Item = function(category, predicted, score, trueVal) {
  // real class
  this.category = category;
  // true value
  this.trueVal = trueVal;
  // predicted class 
  this.predicted = predicted;
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
	this.positiveRate = positiveRate(this.items);
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
			group1.push(new Item(0, -111, d.scores[modelName], d.trueVal)); 
		} else if (d.data[fieldName].toString() == groupName2) {
			group2.push(new Item(1, -111, d.scores[modelName], d.trueVal));
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
function positiveRate(items) {
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

// Bar related functions & vars
function getBarColor(d) {
	return d.predicted == 0 ? '#555' : CATEGORY_COLORS[d.group];
}

function getBarOpacity(d) {
	return .3 + .7 * d.trueVal;
} 

function itemColor(category, predicted) {
  return predicted == 0 ? '#555' : CATEGORY_COLORS[category];
}

function itemOpacity(value) {
  return .3 + .7 * value;
}

var Bar = function(group, predicted, trueVal, score, count, x, y) {
	this.group = group; 
	this.flooredScore = score 
	this.predicted = predicted; 
	this.trueVal = trueVal;
	this.count = count;
	//this.color = getBarColor(this); 
	//this.opacity = getBarOpacity(this); 
	this.w = BAR_WIDTH; 
	this.h = count;
	this.x = x; 
	this.y = y; 
}

function defineBar(selection) {
  selection
  	.attr('class', 'bar')
  	//.attr('stroke', function(d) { return getBarColor(d); })
  	.attr('fill', getBarColor)
  	.attr('fill-opacity', getBarOpacity)
  	//.attr('stroke-opacity', function(d) { return d.opacity; })
  	.attr('x', function(d) { return xMap(d.x); })
  	.attr('y', function(d) { return yMap(d.y); })
  	.attr('width', function(d) { return d.w; })
  	.attr('height', function(d) {return hScale(d.h); }) 

  	// TODO: set these
	function xMap(index) { return index * BAR_WIDTH; }
	function yMap(index) { return HISTOGRAM_HEIGHT-hScale(index); }
	function hScale(h) { return scalar(h); }
}

function createBars(id, items, width, height, threshold) {
  var barData = getBarData(items, threshold); 

  //console.log(barData);

  // initialize svg for bars
  var svg = d3.select('#' + id).append('svg')
    .attr('width', width)
    .attr('height', height);

  var bars = svg.selectAll('.bars').data(barData).enter()
  	.append('rect').call(defineBar); 

  return svg; 
}

function getBarData(items, threshold) {
	var thisBarData = []; 
	var tn = [];
	var fn = []; 
	var fp = []; 
    var tp = []; 
    var combinedCnt = [];
    var groupID = items[0].category;
    var numNegBuckets = Math.ceil(threshold/HISTOGRAM_BUCKET_SIZE);
    var numPosBuckets = NUM_BUCKETS - numNegBuckets;

	// initialize 2 negative arrays 
	for (var i = 0; i < numNegBuckets; ++i) {
		tn.push(0); 
		fn.push(0);
		combinedCnt.push(0);
	}
	// initialize 2 positive arrays
	for (var i = 0; i < numPosBuckets; ++i) {
		fp.push(0); 
		tp.push(0);
		combinedCnt.push(0);
	}

	items.forEach(function(d) {
  	// check left/right to threshold 
	  	var index = Math.floor(d.score/HISTOGRAM_BUCKET_SIZE); 
	  	if (index >= NUM_BUCKETS)
	  		index = NUM_BUCKETS-1;
	  	else if (index < 0)
	  		index = 0;
	  	//console.log(index);
	  	++combinedCnt[index];
	  	if (d.score < threshold) {
			// check negative/positive
			if (d.trueVal == POSITIVE) {
				// false negative
				++fn[index];
			} else if (d.trueVal == NEGATIVE) {
				++tn[index];
			} else { console.log("error"); }
		} else {
			// check negative/positive
			if (d.trueVal == POSITIVE) {
				// true positive 
				++tp[index-numNegBuckets]; 
			} else if (d.trueVal == NEGATIVE) {
				// false positive
				++fp[index-numNegBuckets];
			} else { console.log("error"); }
		}
	});

	// push negatives in barData
	for (var i = 0; i < tn.length; ++i) {
		if (tn[i] != 0) {
			//(group, predicted, trueVal, score, count, x, y)
			var currBar = new Bar(groupID, 0, 0, i * HISTOGRAM_BUCKET_SIZE, 
				tn[i], i, tn[i]+fn[i]); 
			thisBarData.push(currBar);
		}

		if (fn[i] != 0) {
			//(group, predicted, trueVal, count, x, y)
			var currBar = new Bar(groupID, 0, 1, i * HISTOGRAM_BUCKET_SIZE,
				fn[i], i, fn[i]); 
			thisBarData.push(currBar);
		}
	}

	for (var i = 0; i < tp.length; ++i) {
		if (tp[i] != 0) {
			var currBar = new Bar(groupID, 1, 1, (i+tn.length) * HISTOGRAM_BUCKET_SIZE,
				tp[i], i+tn.length, tp[i]); 
			thisBarData.push(currBar);
		}

		if (fp[i] != 0) {
			var currBar = new Bar(groupID, 1, 0, (i+tn.length) * HISTOGRAM_BUCKET_SIZE,
				fp[i], i+tn.length, tp[i]+fp[i]); 
			thisBarData.push(currBar);
		}
	}

	// update barData
	barData[groupID] = thisBarData;

	// set scalar
	scalar = d3.scaleLinear()
		.domain([0, Math.max.apply(Math, combinedCnt)])
		.range([0, HISTOGRAM_HEIGHT-50]);

	return thisBarData;
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
    var copy = new Item(item.category, item.value, item.score, item.trueVal);
    copy.predicted = item.predicted;
    return copy;
  });
}
