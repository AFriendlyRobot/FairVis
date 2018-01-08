var currActive; 
var flag_scatterplot = false;
var flag_histogram = false;

function openTab(evt, tabName) {
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
    evt.currentTarget.className += " active";

    callFunc(tabName);
    currActive = tabName;
}

function callFunc(tabName) {
    if(currActive != tabName) {
        if (tabName == "fairdef") 
            ;
        else if (tabName == "scatterplot" && !flag_scatterplot){
             //$("#scatterplot").removeClass("inactive-viz");
            draw_scatterplot();
            flag_scatterplot = true;
        }
        else if (tabName == "histogram" && !flag_histogram)
            ;
    }
}