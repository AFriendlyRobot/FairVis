// Ref: https://www.codexworld.com/ajax-file-upload-with-form-data-jquery-php-mysql/
// $(document).ready(function(e){
//     $("#fupForm").on('submit', function(e){
//         e.preventDefault();
//         $.ajax({
//             type: 'POST',
//             url: 'submit.php',
//             data: new FormData(this),
//             contentType: false,
//             cache: false,
//             processData:false,
//             beforeSend: function(){
//                 $('.submitBtn').attr("disabled","disabled");
//                 $('#fupForm').css("opacity",".5");
//             },
//             success: function(msg){
//                 $('.statusMsg').html('');
//                 if(msg == 'ok'){
//                     $('#fupForm')[0].reset();
//                     $('.statusMsg').html('<span style="font-size:18px;color:#34A853">Form data submitted successfully.</span>');
//                 }else{
//                     $('.statusMsg').html('<span style="font-size:18px;color:#EA4335">Some problem occurred, please try again.</span>');
//                 }
//                 $('#fupForm').css("opacity","");
//                 $(".submitBtn").removeAttr("disabled");
//             }
//         });
//     });
    
//     //file type validation
//     $("#file").change(function() {
//         var file = this.files[0];
//         var imagefile = file.type;
//         var match= ["image/jpeg","image/png","image/jpg"];
//         if(!((imagefile==match[0]) || (imagefile==match[1]) || (imagefile==match[2]))){
//             alert('Please select a valid image file (JPEG/JPG/PNG).');
//             $("#file").val('');
//             return false;
//         }
//     });
// });

var data;
// var namefileSelected = false;
var datafileSelected = false;
var predictfileSelected = false;
var json; 

$(document).ready(function() {
	data = {};

	$("#upload-form").on('submit', function(e) {
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
	console.log(obj);
	json = obj;
	$("#upload-form").addClass("inactive");
	$("#sample-visualization").removeClass("inactive");

	// draw viz after parsing csv into json
	setup();
	draw_plot();
}











