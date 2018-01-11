// var data;
// var namefileSelected = false;
var protectedFileSelected = false;
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

	$("#protectedfile").change(function() {
		if ($("#protectedfile").val()) {
			protectedFileSelected = true;
		} else {
			protectedFileSelected = false;
		}

		// if (namefileSelected && datafileSelected) {
		if (datafileSelected && protectedFileSelected) {
			enableFormSubmit();
		}
	});

	$("#datafile").change(function() {
		if ($("#datafile").val()) {
			datafileSelected = true;
		} else {
			datafileSelected = false;
		}

		// if (namefileSelected && datafileSelected) {
		if (datafileSelected && protectedFileSelected) {
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
	$("#protectedfile").val("");
	$("#datafile").val("");
	$("#predictfile").val("");
	disableFormSubmit();
}


function parseData(obj) {
	json = obj;
	$("#upload-container").addClass("inactive");
	$("#viz-tabs").removeClass("inactive");
	$("#definitions-tab").click();
	$("#main-header").addClass("inactive");
}











