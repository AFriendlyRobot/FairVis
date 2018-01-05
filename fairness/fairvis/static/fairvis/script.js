var data;
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
					console.log("sending");
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
	$("#sample-visualization").removeClass("inactive");

	$("#viz-container").removeClass("inactive-viz");

	// draw viz after parsing csv into json
	setup();
	draw_plot();
}











