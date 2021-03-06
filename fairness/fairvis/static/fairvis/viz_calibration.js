var cal_settings = {};
var cal_data = {};


var CAL_PLOT_WIDTH = 650;
var CAL_PLOT_HEIGHT = 500;


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
	for (var i = 0; i < json.protectedColNames.length; i++) {
		cname = json.protectedColNames[i];
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

	// Set initial value for protected field
	$("#calibration-protected-selection").val(json.protectedColNames[0]);
	$("#calibration-prediction-selection").val(modelNames[0]);

}


// Ref: https://bl.ocks.org/mbostock/3885304
// Ref: https://bl.ocks.org/mbostock/3887051
function draw_calibration() {
	$("#calibration-svg").empty();
	var cal_svg = d3.select("#calibration-svg"),
		cmargin = { top: 20, right: 50, bottom: 30, left: 40 },
		cwidth = CAL_PLOT_WIDTH - cmargin.left - cmargin.right,
		cheight = CAL_PLOT_HEIGHT - cmargin.top - cmargin.bottom,
		g = cal_svg.append("g").attr("transform", "translate(" + cmargin.left + "," + cmargin.top + ")");

	cal_svg.attr("width", CAL_PLOT_WIDTH);
	cal_svg.attr("height", CAL_PLOT_HEIGHT);

	var featureName = $("#calibration-protected-selection").val().toString();
	var scoreName = $("#calibration-prediction-selection").val().toString();
	var numBins = parseInt($("#calibration-num-bins").val());
	var binnedData = binnedAccuraciesByAttribute(featureName, scoreName, numBins);
	var barPoints = binnedData["pts"];  // [{ binIndex: i, cvName: obsPercent, cvName: obsPercent, . . . }, . . . ]
	var keys = binnedData["cvOptions"];

	var cx0 = d3.scaleBand()
	            .rangeRound([0, cwidth])
	            .paddingInner(0.1);

	var cx1 = d3.scaleBand()
	            .padding(0.05);

	var cy = d3.scaleLinear()
	           .rangeRound([cheight, 0]);

	var ccolorMap = d3.scaleLinear()
	                  .domain(keys)
	                  .range(["hsl(215, 100%, 80%)", "hsl(215, 70%, 50%)"])
	                  .interpolate(d3.interpolateHcl);

	cx0.domain(barPoints.map(function(d) { return d.binIndex }));
	cx1.domain(keys).rangeRound([0, cx0.bandwidth()]);
	cy.domain([0,1.0]).nice();

	g.append("g").selectAll("g").data(barPoints)
	             .enter().append("g")
	             .attr("transform", function(d) { return "translate(" + cx0(d.binIndex) + ",0)"; })
	             .selectAll("rect")
	             .data(function(d) { return keys.map(function(key) { return { key: key, value: d[key] }; }); })
	             .enter().append("rect")
	             .attr("x", function(d) { return cx1(d.key); })
	             .attr("y", function(d) { return cy(d.value); })
	             .attr("width", cx1.bandwidth())
	             .attr("height", function(d) { return cheight - cy(d.value); })
	             .attr("fill", function(d) { return ccolorMap(d.key); });

	g.append("g").attr("class", "axis")
	             .attr("transform", "translate(0," + cheight + ")")
	             .call(d3.axisBottom(cx0));

	g.append("g").attr("class", "axis")
	             .call(d3.axisLeft(cy).ticks(null, "s"))
	             .append("text")
	             .attr("x", 2)
	             .attr("y", cy(cy.ticks().pop()) + 0.5)
	             .attr("dy", "0.32em")
	             .attr("fill", "#000")
	             .attr("font-weight", "bold")
	             .attr("text-anchor", "start")
	             .text("Observed % Where target=1");

	var legend = g.append("g")
	              .attr("font-family", "sans-serif")
	              .attr("font-size", 10)
	              .attr("text-anchor", "end")
	              .selectAll("g")
	              .data(keys.slice().reverse())
	              .enter().append("g")
	              .attr("transform", function(d,i) { return "translate(0," + i * 20 + ")"; });

	legend.append("rect")
	      .attr("x", cwidth+50-19)
	      .attr("width", 19)
	      .attr("height", 19)
	      .attr("fill", ccolorMap);

	legend.append("text")
	      .attr("x", cwidth+50 - 24)
	      .attr("y", 9.5)
	      .attr("dy", "0.32em")
	      .text(function(d) { return d; });

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
		classVal = point["protected"][featureName];
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

	var retPoints = [];

	for (var i = 0; i < numBins; i++) {
		var newPt = {}
		newPt["binIndex"] = i;
		for (var ci = 0; ci < classValList.length; ci++) {
			cvName = classValList[ci];
			cvName = cvName.toString();

			newPt[cvName] = obsPercent[cvName][i];
		}

		retPoints.push(newPt);
	}

	var retObj = { "pts": retPoints, "cvOptions": classValList, "scoreBins": scoreBins, "positiveBins": positiveBins, "negativeBins": negativeBins, "counts": counts };
	return retObj;
}



function binnedAccuraciesByScore(featureName, scoreName, numBins) {
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

	var binWidth = 1.0 / numBins;

	for (var i = 0; i < points.length; i++) {
		point = points[i];
		outcome = point["trueVal"];
		score = point["scores"][scoreName];
		classVal = point["protected"][featureName];
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

		var lowCutoff = 0.0;
		var highCutoff = 0.0;

		for (var i = 0; i < numBins; i++) {
			var tmpScores = [];
			positiveBins[cvName].push(0);
			negativeBins[cvName].push(0);
			counts[cvName].push(0);

			lowCutoff = highCutoff;
			highCutoff += binWidth;
			// for (var j = Math.floor(i * (n / numBins)); j < Math.floor((i+1) * (n / numBins)); j++) {
			// 	tmpScores.push(ctups[j][0]);

			// 	if (ctups[j][1] > 0) {
			// 		positiveBins[cvName][i] += 1;
			// 	} else {
			// 		negativeBins[cvName][i] += 1;
			// 	}

			// 	counts[cvName][i] += 1;
			// }

			for (var j = 0; j < n; j++) {
				if (ctups[j][0] < lowCutoff || ctups[j][0] >= highCutoff) {
					continue;
				} else {
					tmpScores.push(ctups[j][0]);

					if (ctups[j][1] > 0) {
						positiveBins[cvName][i] += 1;
					} else {
						negativeBins[cvName][i] += 1;
					}

					counts[cvName][i] += 1;
				}
			}

			if (tmpScores.length > 0) {
				scoreBins[cvName].push(((tmpScores.reduce((prev, curr) => curr += prev)) / tmpScores.length));
			} else {
				scoreBins[cvName].push(-1);
			}
		}

		// positiveBins[cvName].push(0);
		// negativeBins[cvName].push(0);
		// counts[cvName].push(0);
		// tmpScores = [];

		// for (var i = Math.floor((numBins - 1) * (n / numBins)); i < n; i++) {
		// 	tmpScores.push(ctups[i][0]);

		// 	if (ctups[i][1] > 0) {
		// 		positiveBins[cvName][numBins - 1] += 1;
		// 	} else {
		// 		negativeBins[cvName][numBins - 1] += 1;
		// 	}

		// 	counts[cvName][numBins - 1] += 1;
		// }

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

	// var retPoints = [];

	// for (var i = 0; i < numBins; i++) {
	// 	var newPt = {}
	// 	newPt["binIndex"] = i;
	// 	for (var ci = 0; ci < classValList.length; ci++) {
	// 		cvName = classValList[ci];
	// 		cvName = cvName.toString();

	// 		newPt[cvName] = obsPercent[cvName][i];
	// 	}

	// 	retPoints.push(newPt);
	// }

	var retObj = { "cvOptions": classValList, "scoreBins": scoreBins, "positiveBins": positiveBins, "negativeBins": negativeBins, "counts": counts };
	return retObj;
}




