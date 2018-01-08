// var data;
// var namefileSelected = false;
var datafileSelected = false;
var predictfileSelected = false;
var json; 

$(document).ready(function() {
	data = {};

	$(".upload-form").on('submit', function(e) {
		e.preventDefault();

		// if (namefileSelected && datafileSelected) {
		if (datafileSelected) {
			$.ajax({
				type: 'POST',
				url: $(this).attr('action'),
				data: new FormData(this),
				contentType: false,
				cache: false,
				processData: false,
				beforeSend: function() {
					// console.log("sending");
				},
				success: parseData,
			});
			clearForm();
		} else {
			alert("Please select at least a name file and data file");
		}
	});

	// $("#namefile").change(function() {
	// 	if ($("#namefile").val()) {
	// 		namefileSelected = true;
	// 	} else {
	// 		namefileSelected = false;
	// 	}

	// 	if (namefileSelected && datafileSelected) {
	// 		enableFormSubmit();
	// 	}
	// });

	$("#datafile").change(function() {
		if ($("#datafile").val()) {
			datafileSelected = true;
		} else {
			datafileSelected = false;
		}

		// if (namefileSelected && datafileSelected) {
		if (datafileSelected) {
			enableFormSubmit();
		}
	});

	$("#predictfile").change(function() {
		if ($("#predictfile").val()) {
			predictfileSelected = true;
		} else {
			predictfileSelected = false;
		}
	});
})


function enableFormSubmit() {
	$("#dataSubmit").attr('disabled', false);
}

function disableFormSubmit() {
	$("#dataSubmit").attr('disabled', true);
}

function clearForm() {
	// $("#namefile").val("");
	$("#datafile").val("");
	$("#predictfile").val("");
	disableFormSubmit();
}


function parseData(obj) {
	// console.log(obj);
	json = obj;
	$("#upload-container").addClass("inactive");
	$("#viz-tabs").removeClass("inactive");

	// $("#scatterplot").removeClass("inactive-viz");
}


function binScoresAndOutcomes(dataPoints, scoringName, num_bins) {
	var point;
	var outcome;
	var score;
	var positiveBins = [];
	var negativeBins = [];
	var scoreBins = [];
	var counts = [];
	var pair;
	var pairs = [];
	var sortedPairs;

	for (var i = 0; i < dataPoints.length; i++) {
		point = dataPoints[i]["data"];
		outcome = point["trueVal"];
		score = point["score"][scoringName];

		pair = [score, outcome];
		pairs.push(pair);
	}

	pairs.sort(function (left, right) {
		return left[0] < right[0] ? -1 : 1;
	});

	var n = pairs.length;

	for (var i = 0; i < (num_bins - 1); i++) {
		var tmpScores = [];
		positiveBins.push(0);
		negativeBins.push(0);
		counts.push(0);
		for (var j = Math.floor(i * (n / num_bins)); j < Math.floor((i+1) * (n / num_bins)); i++) {
			tmpScores.push(pairs[j][0]);

			if (pairs[j][1] > 0) {
				positiveBins[i] += 1;
			} else {
				negativeBins[i] += 1;
			}

			counts[i] += 1;
		}

		scoreBins.push(((tmpScores.reduce((prev, curr) => curr += prev)) / tmpScores.length));
	}

	positiveBins.push(0);
	negativeBins.push(0);
	counts.push(0);
	tmpScores = [];

	for (var i = Math.floor((num_bins - 1) * (n / num_bins)); i < n; i++) {
		tmpScores.push(pairs[i][0]);

		if (pairs[i][1] > 0) {
			positiveBins[num_bins - 1] += 1;
		} else {
			negativeBins[num_bins - 1] += 1;
		}

		counts[num_bins - 1] += 1;
	}

	scoreBins.push(((tmpScores.reduce((prev, curr) => curr += prev)) / tmpScores.length));

	return { "scoreBins": scoreBins, "positiveBins": positiveBins, "negativeBins": negativeBins, "counts": counts };
}


function checkCalibration(dataPoints, scoringName, gofThreshold) {
	var NUM_BINS = 10;
	var bins = binScoresAndOutcomes(dataPoints, scoringName, NUM_BINS);

	var stat = 0;
	var numer;
	var denom;

	for (var i = 0; i < NUM_BINS; i++) {
		numer = bins["positiveBins"][i] - (bins["scoreBins"][i]*bins["counts"][i]);
		numer = numer * numer;

		denom = (bins["scoreBins"][i]*bins["counts"][i]) * Math.max(0, (1 - bins["scoreBins"][i]));

		stat += (numer / denom);
	}

	console.log(stat);
}


function checkGroupCalibration(dataPoints, scoringName, featureName, gofThreshold) {
	var splitData = {};
	var point;
	var classVal;

	var values = [];

	for (var i = 0; i < dataPoints.length; i++) {
		point = dataPoints[i];
		classVal = point["data"][featureName];
		console.log(classVal);

		if (classVal in splitData) {
			splitData[classVal].push(point);
		} else {
			values.push(classVal);
			splitData[classVal] = [];
			splitData[classVal].push(point);
		}
	}

	var calResults = {}

	for (var i = 0; i < values.length; i++) {
		calResults[values[i]] = checkCalibration(splitData[values[i]], scoringName, gofThreshold);
	}

	return calResults;
}











