var data; 

function histogram_initialize() {
	data = json.dataPoints;
	var colNames = json.colNames;

	var newOpts
	for (var i = 0; i < colNames.length - 1; i++) {
		newOpt  = "<option class=\"protectedSelectOption\" value=\"";
		newOpt += colNames[i];
		newOpt += "\">" + colNames[i];
		newOpt += "</option>";
		$("#protectedSelection").append(newOpt);
	}
	$("#protectedSelection").val(null);

	$("#protectedSelection").on("change", function() {
		// clear previous options
		$("#group1Selection").empty();
		$("#group2Selection").empty();

		// populate the two sub selectors
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

		// redraw plot 
		$("svg").remove();
		draw_histogram();
	});
}

function draw_histogram() { 
	// TODO: wtf is this 
	var comparisonExample0 = -1;
	var comparisonExample1 = -1;

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

function createHistogram(x, y, z, h) {

}

function createHistogramLegend(x, d) {

}


function Optimizer(model0, model1, stepSize) {
	console.log(0);
	return {
		statisticalParity: function() {
			console.log(1); 
		}, 
		conditionalStatisticalParity: function() {
			console.log(2); 

		}, 
		predictiveEquality: function() {
			console.log(3); 

		},
		predictiveParity: function() {
			console.log(4); 

		},
		errorRateBalance: function() {
			console.log(5); 

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

	this.item.forEach(function(item) {
		item.predicted = item.score >= threshold ? 1 : 0; 
	});
	this.tpr = tpr(this.items); 
	this.positiveRate = PostiveRate(this.items);
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

function makeItems() {
	var data = json.dataPoints; 
	var items = []; 


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