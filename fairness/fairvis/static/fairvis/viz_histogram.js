///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
////                                                                               ////
//// Visualization JS code adapted from histogram code by Martin Wattenberg,       ////
//// Fernanda Viégas, and Moritz Hardt.                                            ////
//// Ref: https://research.google.com/bigpicture/attacking-discrimination-in-ml/   ////
////                                                                               ////
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

var data;
var thresholdGlobal;
var scalar;
var maxBarSize;
var barData;

var leftStats;
var rightStats;

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
var BAR_WIDTH = (HISTOGRAM_WIDTH) / NUM_BUCKETS;

// Padding on left; needed within SVG so annotations show up.
var LEFT_PAD = 10;

// colors
var CATEGORY_COLORS = ['#039', '#c70'];
var PIE_COLORS = [['#686868', '#ccc','#039', '#92a5ce'],
                  ['#686868', '#ccc','#c70',  '#f0d6b3']];


function draw_histogram() {
	$("#histogram0").empty();
	$("#histogram1").empty();
	$("#histogram-legend0").empty();
	$("#histogram-legend1").empty();
	precalculateThresholdedStatistics();
	thresholdGlobal = 0.5;
	scalar = null;
	maxBarSize = 0.0;
	barData = [[], []];
	histogram_main(); 
}

function histogram_initialize() {
	data = json.dataPoints;
	var colNames = json.protectedColNames;
	var modelNames = Object.keys(data[0].scores);

	// populate options for protected field selection
	var newOpts;
	for (var i = 0; i < colNames.length; i++) {
		newOpt  = "<option class=\"protectedSelectOption\" value=\"";
		newOpt += colNames[i];
		newOpt += "\">" + colNames[i];
		newOpt += "</option>";
		$("#protectedSelection").append(newOpt);
	}
	$("#protectedSelection").val(colNames[0]);

	// populate options for model selector
	var newOpts;
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

	precalculateThresholdedStatistics();
}

function precalculateThresholdedStatistics() {
	var binnedData = binnedAccuraciesByAttribute($("#protectedSelection").val(), $("#modelSelection").val(), NUM_BUCKETS);

	leftStats = calcStatsForThresholds(binnedData, $("#group1Selection").val());
	rightStats = calcStatsForThresholds(binnedData, $("#group2Selection").val());

	// scalar = d3.scaleLinear()
	// 		.domain([0, Math.max(leftStats.largestBin, rightStats.largestBin)])
	// 		.range([0, HISTOGRAM_HEIGHT-50]);
}

function calcStatsForThresholds(binnedData, groupName) {
	var statsObj = {}
	statsObj["tp"] = [];
	statsObj["fp"] = [];
	statsObj["tn"] = [];
	statsObj["fn"] = [];
	statsObj["tpr"] = [];
	statsObj["fpr"] = [];
	statsObj["tnr"] = [];
	statsObj["fnr"] = [];
	statsObj["accuracy"] = [];
	statsObj["cutoff"] = [];

	// Initialization before walking through possible cutoffs left(low) -> right(high)
	var cutoff = 0;
	var fn = 0;
	var tn = 0;

	var totalPositive = binnedData["positiveBins"][groupName].reduce((prev, curr) => curr += prev);
	var totalNegative = binnedData["negativeBins"][groupName].reduce((prev, curr) => curr += prev);

	var tp = totalPositive;
	var fp = totalNegative;

	var largestBin = 0;

	statsObj["tp"].push(tp);
	statsObj["fp"].push(fp);
	statsObj["tn"].push(tn);
	statsObj["fn"].push(fn);
	statsObj["tpr"].push(tp / (tp+fn));
	statsObj["fpr"].push(fp / (fp+tn));
	statsObj["tnr"].push(tn / (tn+fp));
	statsObj["fnr"].push(fn / (tp+fn));
	statsObj["accuracy"].push((tp+tn)/(tp+tn+fp+fn));
	statsObj["cutoff"].push(cutoff);

	var posShift;
	var negShift;

	// Including both ends, should be NUM_BUCKETS+1 possible cutoffs.
	//     First (0) has already been pushed, so we have NUM_BUCKETS more to iterate over.
	for (var i = 0; i < NUM_BUCKETS; i++) {
		cutoff += HISTOGRAM_BUCKET_SIZE;

		// Shift the theoretical cutoff
		posShift = binnedData["positiveBins"][groupName][i];
		negShift = binnedData["negativeBins"][groupName][i];
		binTotal = posShift + negShift;

		if (binTotal > largestBin) {
			largestBin = binTotal;
		}

		tp -= posShift;
		fn += posShift;

		fp -= negShift;
		tn += negShift;

		statsObj["tp"].push(tp);
		statsObj["fp"].push(fp);
		statsObj["tn"].push(tn);
		statsObj["fn"].push(fn);
		statsObj["tpr"].push(tp / (tp+fn));
		statsObj["fpr"].push(fp / (fp+tn));
		statsObj["tnr"].push(tn / (tn+fp));
		statsObj["fnr"].push(fn / (tp+fn));
		statsObj["accuracy"].push((tp+tn)/(tp+tn+fp+fn));
		statsObj["cutoff"].push(cutoff);
	}

	statsObj.largestBin = largestBin;

	return statsObj;
}

function histogram_main() { 
	var groups = makeItemsFor2Groups($("#protectedSelection").val(), $("#group1Selection").val(), 
		$("#group2Selection").val(), $("#modelSelection").val());

	var comparisonExample0 = new GroupModel(groups[0]);
	var comparisonExample1 = new GroupModel(groups[1]);

	var optimizer = Optimizer(comparisonExample0, comparisonExample1); 

	// Available options: maximumAccuracy, statisticalParity, equalThreshold, equalOdds, predictiveParity
	$("#optimize-accuracy").click(optimizer.maximumAccuracy);
	$("#optimize-statistical-parity").click(optimizer.statisticalParity);
	$("#optimize-equal-threshold").click(optimizer.equalThreshold);
	$("#optimize-equal-odds").click(optimizer.equalOdds);
	$("#optimize-predictive-parity").click(optimizer.predictiveParity);

	// TODO
	/*
	// Make correctness matrices.
	createCorrectnessMatrix('correct0', comparisonExample0);
	createCorrectnessMatrix('correct1', comparisonExample1);

	// Create pie charts
	createRatePies('pies0', comparisonExample0, PIE_COLORS[0], true);
	createRatePies('pies1', comparisonExample1, PIE_COLORS[1], true);
	*/

	// make histograms & legends
	createHistogram('histogram0', comparisonExample0, false, false);
	createHistogram('histogram1', comparisonExample1, false, false);
	createHistogramLegend('histogram-legend0', 0);
	createHistogramLegend('histogram-legend1', 1);

	// TODO: update micro-story annotations for each definition 
	comparisonExample0.classify(0.5);
	comparisonExample1.classify(0.5);
	comparisonExample0.notifyListeners();
	comparisonExample1.notifyListeners();
}

function createHistogram(id, model, noThreshold, includeAnnotation) {
	var width = HISTOGRAM_WIDTH;
	var height = HEIGHT;
	var bottom = height - 16;

	// Create an internal copy.
	var items = copyItems(model.items);

	// Icons
	//var numBuckets = 20;
	var SIDE = (HISTOGRAM_WIDTH) / NUM_BUCKETS;
	var pedestalWidth = NUM_BUCKETS * SIDE;
	var hx = (width - pedestalWidth) / 2;
	var scale = d3.scaleLinear().range([hx, hx + pedestalWidth]).domain([0, 1]);

	function histogramLayout(items, x, y, side, low, high, bucketSize) {
		var buckets = [];
		var maxNum = Math.floor((high - low) / bucketSize);
		items.forEach(function(item) {
			var bn = Math.floor((item.score - low) / bucketSize);
			bn = Math.max(0, Math.min(maxNum, bn));
			buckets[bn] = 1 + (buckets[bn] || 0);
			item.x = x + (side * bn);
			item.y = y - (side * buckets[bn]);
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
		.attr('x', tx - annotationW / 2)
		.attr('y', 30 - annotationPad)
		.attr('rx', 20)
		.attr('ry', 20)
		.attr('width', annotationW)
		.attr('height', 30);
	}
	

	function setThreshold(t, eventFromUser) {
		t = Math.max(0.0, Math.min(t, 1.0));
		if (eventFromUser) {
			t = HISTOGRAM_BUCKET_SIZE * Math.round(t / HISTOGRAM_BUCKET_SIZE);
		} else {
			tx = Math.round(scale(t));
		}
		tx = Math.max(0, Math.min(width, tx));
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
		t = HISTOGRAM_BUCKET_SIZE * Math.round(t / HISTOGRAM_BUCKET_SIZE);
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

// Create two pie charts: 1. for all classification rates
// and 2. true positive rates.
function createRatePies(id, model, palette, includeAnnotations) {
  var width = 300;
  var lx = 0;
  var height = 170;
  var svg = d3.select('#' + id).append('svg')
    .attr('width', width)
    .attr('height', height);
  // Add a little margin so the annotation rectangle
  // around "True Positive Rate" doesn't get cut off.
  svg = svg.append('g').attr('transform', 'translate(10,0)');
  var tprColors = [palette[0], palette[2]];
  var cy = 120;
  var tprPie = createPie('tpr-' + id, [1,1], tprColors, svg, 45, cy, 40);
  var allPie = createPie('all-' + id, [1,1,1,1], palette, svg, 195, cy, 40);
  var topY = 35;

  var tprLabel = createPercentLabel(svg, lx, topY, 'True Positive Rate',
      'pie-label', 'pie-number');
  var posLabel = createPercentLabel(svg, width / 2, topY, 'Positive Rate',
      'pie-label', 'pie-number');

  // Add annotation labels, if requested:
  if (includeAnnotations) {
    // var tprAnnotation = svg.append('rect')
    //     .attr('class', 'annotation equal-opportunity-annotation')
    //     .attr('x', -8)
    //     .attr('y', 14)
    //     .attr('rx', 20)
    //     .attr('ry', 20)
    //     .attr('width', width / 2 - 10)
    //     .attr('height', 30);
    // var posAnnotation = svg.append('rect')
    //     .attr('class', 'annotation demographic-parity-annotation')
    //     .attr('x', width / 2 - 10)
    //     .attr('y', 14)
    //     .attr('rx', 20)
    //     .attr('ry', 20)
    //     .attr('width', width / 2 - 30)
    //     .attr('height', 30);
  }

  model.addListener(function() {
    var items = model.items;
    tprPie([countMatches(items, 1, 0),
            countMatches(items, 1, 1)]);
    allPie([countMatches(items, 1, 0), countMatches(items, 0, 0),
            countMatches(items, 1, 1), countMatches(items, 0, 1)]);
    tprLabel(model.tpr);
    posLabel(model.positiveRate);
  });
}

// Create a pie chart.
function createPie(id, values, colors, svg, ox, oy, radius) {
  var angles = [];
  function makeAngles(values) {
    var total = 0;
    for (var i = 0; i < values.length; i++) {
      total += values[i];
    }
    var sum = 0;
    for (var i = 0; i < values.length; i++) {
      var start = 2 * Math.PI * sum / total;
      sum += values[i];
      var end = 2 * Math.PI * sum / total;
      angles[i] = [start, end];
    }
  }
  makeAngles(values);
  var slices = svg.selectAll('.slice-' + id);
  function makeArc(d) {
    return d3.arc()
      .innerRadius(0)
      .outerRadius(radius)
      .startAngle(d[0]).endAngle(d[1])();
  }
  slices.data(angles).enter().append('path')
    .attr('class', 'slice-' + id)
    .attr('d', makeArc)
    .attr('fill', function(d, i) {return colors[i]})
    .attr('transform', 'translate(' + ox + ',' + oy + ')');
  return function(newValues) {
    makeAngles(newValues);
    svg.selectAll('.slice-' + id)
        .data(angles)
        .attr('d', makeArc);
  }
}

// Creates matrix view of dots representing correct and
// incorrect items.
function createCorrectnessMatrix(id, model) {
  var width = 300;
  var height = 170;
  var correct, incorrect;
  function layout() {
    correct = model.items.filter(function(item) {
      return item.value == item.predicted;
    });
    incorrect = model.items.filter(function(item) {
      return item.value != item.predicted;
    });
    gridLayout(correct, 2, 80);
    gridLayout(incorrect, width / 2 + 4, 80);
  }

  layout();
  var svg = createIcons(id, model.items, width, height, LEFT_PAD);

  var topY = 18;
  var correctLabel = createPercentLabel(svg, 0, topY, 'Correct',
      'pie-label', 'pie-number');
  var incorrectLabel = createPercentLabel(svg, width / 2 + 4, topY, 'Incorrect',
      'pie-label', 'pie-number');

  // Add explanation of correct decisions.
  explanation(svg, ['Accuracy'], 0, topY);
  explanation(svg, ['1 - Accuracy'], width / 2 + 4, topY);

  // Add explanation of incorrect
  model.addListener(function() {
    layout();
    correctLabel(correct.length / model.items.length);
    incorrectLabel(incorrect.length / model.items.length);
    svg.selectAll('.icon').call(defineIcon);
  });
}


// Using global variables instead to allow for changes in selected protected feature values
function Optimizer(leftModel, rightModel) {
	var ERROR_BAR = 0.01;

	function roundedThreshold(rough) {
		return HISTOGRAM_BUCKET_SIZE * Math.round(rough / HISTOGRAM_BUCKET_SIZE);
	}

	return {
		maximumAccuracy: function() {
			// Simple maximization of (tp+tn)/(tp+tn+fp+fn)
			var ls = leftStats;
			var rs = rightStats;
			var bestAcc = 0.0;
			var bestLeft = 0.0;
			var bestRight = 0.0;
			for (var l = 0; l <= NUM_BUCKETS; l++) {
				for (var r = 0; r <= NUM_BUCKETS; r++) {
					var tmpAcc = (ls.tp[l] + ls.tn[l] + rs.tp[r] + rs.tn[r]) / (ls.tp[l] + rs.tp[r] + ls.tn[l] + rs.tn[r] + ls.fp[l] + rs.fp[r] + ls.fn[l] + rs.fn[r]);
					// console.log(l, ": ", ls.cutoff[l], "|", r, ": ", rs.cutoff[r], "|", tmpAcc);
					if (tmpAcc >= bestAcc) {
						bestAcc = tmpAcc;
						bestLeft = ls.cutoff[l];
						bestRight = rs.cutoff[r];
					}
				}
			}

			// console.log(bestLeft, bestRight, bestAcc);

			leftModel.classify(roundedThreshold(bestLeft));
			leftModel.notifyListeners('maximumAccuracy');
			rightModel.classify(roundedThreshold(bestRight));
			rightModel.notifyListeners('maximumAccuracy');
		},
		statisticalParity: function() {
			// ((fp + tp) / total) is equal between groups

			var ls = leftStats;
			var rs = rightStats;
			var bestAcc = 0.0;
			var bestLeft = 0.0;
			var bestRight = 0.0;
			for (var l = 0; l <= NUM_BUCKETS; l++) {
				for (var r = 0; r <= NUM_BUCKETS; r++) {
					var lCheck = ((ls.fp[l] + ls.tp[l]) / (ls.tp[l] + ls.fp[l] + ls.tn[l] + ls.fn[l]));
					var rCheck = ((rs.fp[r] + rs.tp[r]) / (rs.tp[r] + rs.fp[r] + rs.tn[r] + rs.fn[r]));
					if (Math.abs(lCheck - rCheck) <= ERROR_BAR) {
						var tmpAcc = (ls.tp[l] + ls.tn[l] + rs.tp[r] + rs.tn[r]) / (ls.tp[l] + rs.tp[r] + ls.tn[l] + rs.tn[r] + ls.fp[l] + rs.fp[r] + ls.fn[l] + rs.fn[r]);
						// console.log(l, ": ", ls.cutoff[l], "|", r, ": ", rs.cutoff[r], "|", tmpAcc);
						if (tmpAcc >= bestAcc) {
							bestAcc = tmpAcc;
							bestLeft = ls.cutoff[l];
							bestRight = rs.cutoff[r];
						}
					}
				}
			}

			// console.log(bestLeft, bestRight, bestAcc);

			leftModel.classify(roundedThreshold(bestLeft));
			leftModel.notifyListeners('statisticalParity');
			rightModel.classify(roundedThreshold(bestRight));
			rightModel.notifyListeners('statisticalParity');
		},
		equalThreshold: function() {
			// Thresholds simple the same

			var ls = leftStats;
			var rs = rightStats;
			var bestAcc = 0.0;
			var bestLeft = 0.0;
			var bestRight = 0.0;
			for (var i = 0; i <= NUM_BUCKETS; i++) {
				var tmpAcc = (ls.tp[i] + ls.tn[i] + rs.tp[i] + rs.tn[i]) / (ls.tp[i] + rs.tp[i] + ls.tn[i] + rs.tn[i] + ls.fp[i] + rs.fp[i] + ls.fn[i] + rs.fn[i]);
				// console.log(l, ": ", ls.cutoff[l], "|", r, ": ", rs.cutoff[r], "|", tmpAcc);
				if (tmpAcc >= bestAcc) {
					bestAcc = tmpAcc;
					bestLeft = ls.cutoff[i];
					bestRight = rs.cutoff[i];
				}
			}

			// console.log(bestLeft, bestRight, bestAcc);

			leftModel.classify(roundedThreshold(bestLeft));
			leftModel.notifyListeners('equalThreshold');
			rightModel.classify(roundedThreshold(bestRight));
			rightModel.notifyListeners('equalThreshold');
		},
		equalOdds: function() {
			// (fp / (fp+tn)) equal between groups, AND (fn / (tp+fn)) is equal between groups

			var ls = leftStats;
			var rs = rightStats;
			var bestAcc = 0.0;
			var bestLeft = 0.0;
			var bestRight = 0.0;
			for (var l = 0; l <= NUM_BUCKETS; l++) {
				for (var r = 0; r <= NUM_BUCKETS; r++) {
					var lCheckA = (ls.fp[l] / (ls.fp[l] + ls.tn[l]));
					var rCheckA = (rs.fp[r] / (rs.fp[r] + rs.tn[r]));
					var lCheckB = (ls.fn[l] / (ls.tp[l] + ls.fn[l]));
					var rCheckB = (rs.fn[r] / (rs.tp[r] + rs.fn[r]));
					if ((Math.abs(lCheckA - rCheckA) <= ERROR_BAR) && (Math.abs(lCheckB - rCheckB) <= ERROR_BAR)) {
						var tmpAcc = (ls.tp[l] + ls.tn[l] + rs.tp[r] + rs.tn[r]) / (ls.tp[l] + rs.tp[r] + ls.tn[l] + rs.tn[r] + ls.fp[l] + rs.fp[r] + ls.fn[l] + rs.fn[r]);
						// console.log(l, ": ", ls.cutoff[l], "|", r, ": ", rs.cutoff[r], "|", tmpAcc);
						if (tmpAcc >= bestAcc) {
							bestAcc = tmpAcc;
							bestLeft = ls.cutoff[l];
							bestRight = rs.cutoff[r];
						}
					}
				}
			}

			// console.log(bestLeft, bestRight, bestAcc);

			leftModel.classify(roundedThreshold(bestLeft));
			leftModel.notifyListeners('equalOdds');
			rightModel.classify(roundedThreshold(bestRight));
			rightModel.notifyListeners('equalOdds');
		},
		predictiveParity: function() {
			// (tp / (fp+tp)) equal between groups

			var ls = leftStats;
			var rs = rightStats;
			var bestAcc = 0.0;
			var bestLeft = 0.0;
			var bestRight = 0.0;
			for (var l = 0; l <= NUM_BUCKETS; l++) {
				for (var r = 0; r <= NUM_BUCKETS; r++) {
					var lCheck = (ls.tp[l] / (ls.tp[l] + ls.fp[l]));
					var rCheck = (rs.tp[r] / (rs.tp[r] + rs.fp[r]));
					if (Math.abs(lCheck - rCheck) <= ERROR_BAR) {
						var tmpAcc = (ls.tp[l] + ls.tn[l] + rs.tp[r] + rs.tn[r]) / (ls.tp[l] + rs.tp[r] + ls.tn[l] + rs.tn[r] + ls.fp[l] + rs.fp[r] + ls.fn[l] + rs.fn[r]);
						// console.log(l, ": ", ls.cutoff[l], "|", r, ": ", rs.cutoff[r], "|", tmpAcc);
						if (tmpAcc >= bestAcc) {
							bestAcc = tmpAcc;
							bestLeft = ls.cutoff[l];
							bestRight = rs.cutoff[r];
						}
					}
				}
			}

			// console.log(bestLeft, bestRight, bestAcc);

			leftModel.classify(roundedThreshold(bestLeft));
			leftModel.notifyListeners('predictiveParity');
			rightModel.classify(roundedThreshold(bestRight));
			rightModel.notifyListeners('predictiveParity');
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

var GroupModel = function(items) {
	this.items = items; 
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
		if (d["protected"][fieldName].toString() == groupName1) {
			group1.push(new Item(0, -111, d.scores[modelName], d.trueVal)); 
		} else if (d["protected"][fieldName].toString() == groupName2) {
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

// Count specified type of items.
function countMatches(items, value, predicted) {
  var n = 0;
  items.forEach(function(item) {
    if (item.value == value && item.predicted == predicted) {
      n++;
    }
  });
  return n;
}

function getGroupOptions(colName) {
	var opts = []; 

	data.forEach(function(d) {
		if(!opts.includes(d["protected"][colName])) {
			opts.push(d["protected"][colName]); 
		}
	});
	return opts;
}

function populate_groups() {
	var options = getGroupOptions($("#protectedSelection").val());
	var newOpts;
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
function getColor(d) {
	return d.predicted == 0 ? '#555' : CATEGORY_COLORS[d.group];
}

function getOpacity(d) {
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
  	.attr('fill', getColor)
  	.attr('fill-opacity', getOpacity)
  	//.attr('stroke-opacity', function(d) { return d.opacity; })
  	.attr('x', function(d) { return xMap(d.x); })
  	.attr('y', function(d) { return yMap(d.y); })
  	.attr('width', function(d) { return d.w; })
  	.attr('height', function(d) {return hScale(d.h); }) 

  	// TODO: set these
	function xMap(index) { return (index) * BAR_WIDTH; }
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
	var tmpMaxBar = Math.max.apply(0, combinedCnt);
	if (tmpMaxBar > maxBarSize) {
		scalar = d3.scaleLinear()
			.domain([0, Math.max.apply(0, combinedCnt)])
			.range([0, HISTOGRAM_HEIGHT-50]);
		maxBarSize = tmpMaxBar;
	}

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

// Icon for a person in histogram or correctness matrix.
function defineIcon(selection) {
  selection
    .attr('class', 'icon')
    .attr('stroke', getColor)
    .attr('fill', getColor)
    .attr('fill-opacity', getOpacity)
    .attr('stroke-opacity', function(d) {return .4 + .6 * d.value;})
    .attr('cx', function(d) {return d.x + d.side / 2;})
    .attr('cy', function(d) {return d.y + d.side / 2;})
    .attr('r', function(d) {return d.side * .4});
}

// Create a nice label for percentages; the return value is a callback
// to update the number.
function createPercentLabel(svg, x, y, text, labelClass, statClass) {
  var label = svg.append('text').text(text)
      .attr('x', x).attr('y', y).attr('class', labelClass);
  var labelWidth = label.node().getComputedTextLength();
  var stat = svg.append('text').text('')
      .attr('x', x + labelWidth + 4).attr('y', y).attr('class', statClass);

  // Return a function that updated the label.
  return function(value) {
    var formattedValue = Math.round(100 * value) + '%';
    stat.text(formattedValue);
  }
}

// Helper for multiline explanations.
function explanation(svg, lines, x, y) {
  lines.forEach(function(line) {
    svg.append('text').text(line)
        .attr('x', x).attr('y', y += 16).attr('class', 'explanation');
  });
}