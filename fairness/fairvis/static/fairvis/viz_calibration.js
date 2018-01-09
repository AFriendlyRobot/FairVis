var cal_settings = {};
var cal_data = {};


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
	$("#calibration-protected-selection").change(updateCalibrationClassSelection);

	// Set initial value for protected field
	$("#calibration-protected-selection").val(json.colNames[0]);
	$("#calibration-prediction-selection").val(modelNames[0]);

	updateCalibrationClassSelection();

}


function updateCalibrationClassSelection() {
	$("#calibration-class-value-selection").empty();

	var colName = $("#calibration-protected-selection").val();
	var point;

	options = [];

	for (var i = 0; i < json.dataPoints.length; i++) {
		point = json.dataPoints[i];
		if (!options.includes(point["data"][colName])) {
			options.push(point["data"][colName]);
		}
	}

	for (var i = 0; i < options.length; i++) {
		optName = options[i];
		newOpt  = "<option class=\"calibration-class-value-option\" value=\"";
		newOpt += optName + "\">" + optName + "</option>";
		$("#calibration-class-value-selection").append(newOpt);
	}

	$("#calibration-class-value-selection").val(options[0]);
}




