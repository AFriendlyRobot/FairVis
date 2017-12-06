// $("#upload-form").submit(function (event) {
//     event.preventDefault();
//     var frm = $("#upload-form");
//     $.ajax({
//         type: "POST",
//         url: frm.attr("action"),
//         data: frm.serialize(),
//         // Probably not the right way to specify callbacks here
//         success: function (data) {
//             console.log(data);
//         },
//         error: function (error) {
//             console.log(error);
//         }
//     })
// })