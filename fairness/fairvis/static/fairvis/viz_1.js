var confusionMatrix = [
[169, 10],
[7, 46]
];

var tp = confusionMatrix[0][0];
var fn = confusionMatrix[0][1];
var fp = confusionMatrix[1][0];
var tn = confusionMatrix[1][1];

var p = tp + fn;
var n = fp + tn;

var accuracy = (tp+tn)/(p+n);
var f1 = 2*tp/(2*tp+fp+fn);
var precision = tp/(tp+fp);
var recall = tp/(tp+fn);

accuracy = Math.round(accuracy * 100) / 100
f1 = Math.round(f1 * 100) / 100
precision = Math.round(precision * 100) / 100
recall = Math.round(recall * 100) / 100

var computedData = [];
computedData.push({"F1":f1, "PRECISION":precision,"RECALL":recall,"ACCURACY":accuracy});

var labels = ['Class A', 'Class B'];
Matrix({
	container : '#container',
	data      : confusionMatrix,
	labels    : labels,
	start_color : '#ffffff',
	end_color : '#e67e22'
});

// rendering the table
var table = tabulate(computedData, ["F1", "PRECISION","RECALL","ACCURACY"]);
