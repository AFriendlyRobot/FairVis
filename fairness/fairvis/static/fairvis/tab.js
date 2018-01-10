var currActive; 
var flag_scatterplot = false;
var flag_histogram = false;
var flag_calibration = false;

function openTab(id, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    // evt.currentTarget.className += " active";
    $("#" + id).addClass("active");

    callFunc(tabName);
    currActive = tabName;
}

function callFunc(tabName) {
    if(currActive != tabName) {
        if (tabName == "fairdef") 
            return;
        else if (tabName == "scatterplot" && !flag_scatterplot){
             //$("#scatterplot").removeClass("inactive-viz");
            draw_scatterplot();
            flag_scatterplot = true;
        }
        else if (tabName == "histogram" && !flag_histogram) {
            histogram_initialize();
            flag_histogram = true;
        } else if (tabName == "calibration" && !flag_calibration) {
            calibration_initialize();
            flag_calibration = true;
        }
    }
}