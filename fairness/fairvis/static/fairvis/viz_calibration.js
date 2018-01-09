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

	// TODO(tfs): Color scale for bars based on number of options
	// var cz = d3.scaleOridinal()
	//            .range
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




