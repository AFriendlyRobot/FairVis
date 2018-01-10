var cal_settings = {};
var cal_data = {};


var CAL_PLOT_WIDTH = 800;
var CAL_PLOT_HEIGHT = 600;


function calibration_initialize() {
	// Not using let, don't want to worry about potential adoption rate issues
	var cname;
	var cval;
	var newOpt;
	var optName;
	var options;
	var modelNames = Object.keys(json.dataPoints[0].scores);
	var mname;

	// Initialize options for selecting protected field
	for (var i = 0; i < json.colNames.length; i++) {
		cname = json.colNames[i];
		newOpt  = "<option class=\"calibration-protected-feature-option\" value=\"";
		newOpt += cname + "\">" + cname + "</option>";
		$("#calibration-protected-selection").append(newOpt);
	}

	for (var i = 0; i < modelNames.length; i++) {
		mname = modelNames[i];

		newOpt  = "<option class=\"calibration-model-option\" value=\"";
		newOpt += mname + "\">" + mname + "</option>";

		$("#calibration-prediction-selection").append(newOpt);
	}

	// Populate class value selection options
	// $("#calibration-protected-selection").change(updateCalibrationClassSelection);

	// Set initial value for protected field
	$("#calibration-protected-selection").val(json.colNames[0]);
	$("#calibration-prediction-selection").val(modelNames[0]);

	// updateCalibrationClassSelection();

}


// Ref: https://bl.ocks.org/mbostock/3885304
// Ref: https://bl.ocks.org/mbostock/3887051
function draw_calibration() {
	var cal_svg = d3.select("#calibration-svg"),
		cmargin = { top: 20, right: 20, bottom: 30, left: 40 },
		cwidth = +svg.attr("width") - margin.left - margin.right,
		cheight = +svg.attr("height") - margin.top - margin.bottom,
		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.attr("width", CAL_PLOT_WIDTH);
	svg.attr("height", CAL_PLOT_HEIGHT);

	var cx0 = d3.scaleBand()
	            .rangeRound([0, cwidth])
	            .paddingInner(0.1);

	var cx1 = d3.scaleBand()
	            .padding(0.05);

	var cy = d3.scaleLinear()
	           .rangeRound([cheight, 0]);

	var ccolorMap = d3.scaleLinear()
	                  .domain([0, calNumClassOptions()])
	                  .range("hsl(215,70%,50%)", "hsl(215,100%,80%)")
	                  .interpolate(d3.interpolateHcl);

	var featureName = $("#calibration-protected-selection").val().toString();
	var scoreName = $("#calibration-prediction-selection").val().toString();
	var numBins = parssInt($("#calibration-num-bins").val());
	var binnedData = binnedAccuraciesByAttribute(featureName, scoreName, numBins);
}


function binnedAccuraciesByAttribute(featureName, scoreName, numBins) {
	var points = json.dataPoints;
	var point;
	var outcome;
	var score;
	var positiveBins = {};
	var negativeBins = {};
	var scoreBins = {};
	var counts = {};
	var tup;
	var tups = {};
	var sortedtups;
	var classVal;

	for (var i = 0; i < points.length; i++) {
		point = points[i];
		outcome = point["trueVal"];
		score = point["scores"][scoreName];
		classVal = point["data"][featureName];
		classVal = classVal.toString();

		if (!(Object.keys(tups).includes(classVal))) {
			tups[classVal] = [];
		}

		tup = [score, outcome];
		tups[classVal].push(tup);
	}

	var classValList = Object.keys(tups);

	for (var i = 0; i < classValList.length; i++) {
		tups[classValList[i]].sort(function (left, right) {
			return left[0] < right[0] ? -1 : 1;
		});
	}

	var cvName;
	var n;
	var ctups;

	for (var ci = 0; ci < classValList.length; ci++) {
		cvName = classValList[ci];
		cvName = cvName.toString();
		n = tups[cvName].length;
		ctups = tups[cvName];

		positiveBins[cvName] = [];
		negativeBins[cvName] = [];
		counts[cvName] = [];
		scoreBins[cvName] = [];

		for (var i = 0; i < (numBins - 1); i++) {
			var tmpScores = [];
			positiveBins[cvName].push(0);
			negativeBins[cvName].push(0);
			counts[cvName].push(0);
			for (var j = Math.floor(i * (n / numBins)); j < Math.floor((i+1) * (n / numBins)); j++) {
				tmpScores.push(ctups[j][0]);

				if (ctups[j][1] > 0) {
					positiveBins[cvName][i] += 1;
				} else {
					negativeBins[cvName][i] += 1;
				}

				counts[cvName][i] += 1;
			}

			scoreBins[cvName].push(((tmpScores.reduce((prev, curr) => curr += prev)) / tmpScores.length));
		}

		positiveBins[cvName].push(0);
		negativeBins[cvName].push(0);
		counts[cvName].push(0);
		tmpScores = [];

		for (var i = Math.floor((numBins - 1) * (n / numBins)); i < n; i++) {
			tmpScores.push(ctups[i][0]);

			if (ctups[i][1] > 0) {
				positiveBins[cvName][numBins - 1] += 1;
			} else {
				negativeBins[cvName][numBins - 1] += 1;
			}

			counts[cvName][numBins - 1] += 1;
		}

		// scoreBins[cvName].push(((tmpScores.reduce((prev, curr) => curr += prev)) / tmpScores.length));
	}

	var obsPercent = {}

	for (var ci = 0; ci < classValList.length; ci++) {
		cvName = classValList[ci];
		cvName = cvName.toString();

		obsPercent[cvName] = [];

		for (var i = 0; i < positiveBins[cvName].length; i++) {
			var newPercent = positiveBins[cvName][i] / counts[cvName][i];
			obsPercent[cvName].push(newPercent);
		}
	}

	// return { "scoreBins": scoreBins, "positiveBins": positiveBins, "negativeBins": negativeBins, "counts": counts };
	return obsPercent;
}


// function updateCalibrationClassSelection() {
// 	$("#calibration-class-value-selection").empty();

// 	var colName = $("#calibration-protected-selection").val();
// 	var point;

// 	options = [];

// 	for (var i = 0; i < json.dataPoints.length; i++) {
// 		point = json.dataPoints[i];
// 		if (!options.includes(point["data"][colName])) {
// 			options.push(point["data"][colName]);
// 		}
// 	}

// 	for (var i = 0; i < options.length; i++) {
// 		optName = options[i];
// 		newOpt  = "<option class=\"calibration-class-value-option\" value=\"";
// 		newOpt += optName + "\">" + optName + "</option>";
// 		$("#calibration-class-value-selection").append(newOpt);
// 	}

// 	$("#calibration-class-value-selection").val(options[0]);
// }




