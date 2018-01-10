import json
import numpy as np
# from scipy.stats import chi2

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.template import loader

from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

# Create your views here.

# def index(request):

#     # Handle the upload
#     if request.POST and request.FILES:
#         print(request.FILES['dataset'])

#     return render(request, "upload.html", locals())

def index(request):
    # return HttpResponse('Yo')
    # if request.method == 'POST':
    #     dfile = request.FILES['datafile']
    #     # print(type(dfile))

    return render(request, 'fairvis/index.html', {})

def upload_data(request):
    if request.method == 'POST':
        # nfile = request.FILES['namefile']
        # names = parse_file(nfile)

        dfile = request.FILES['datafile']
        names, data = parse_file(dfile)

        predictions = None
        if 'predictfile' in request.FILES:
            predictions = parse_predictions(request.FILES['predictfile'])

        full_data = {}
        full_data['nameData'] = names
        full_data['trainData'] = data

        # parsed_name_file = parse_file(nfile)
        # parsed_name_file, parsed_data_file = parse_file(dfile)

        # If "classification" checked
        if 'classification' in request.POST:
            full_data['linearScore'] = linear_prediction(data).tolist()
            full_data['rforestScore'] = rforest_regression(data).tolist()
            full_data['linearPredictions']  = class_prediction(data).tolist()
            full_data['rforestPredictions'] = rforest_classification(data).tolist()
            full_data['logisticScore'] = logistic_score(data)
        else:
            full_data['linearPredictions']  = linear_prediction(data).tolist()
            full_data['rforestPredictions'] = rforest_regression(data).tolist()

        response_data = []

        num_points = len(full_data['trainData'])

        for i in range(num_points):
            new_point = {}
            new_data = full_data['trainData'][i]
            new_point['data'] = {}
            # print(names)
            # print(new_data)
            for j in range(len(names)-1):
                # print(j)
                # print(names[j])
                # print(new_data[j])
                featVal = new_data[j]
                if not featVal == "NA":
                    featVal = float(featVal)
                new_point['data'][names[j]] = featVal
            # new_point['data'] = full_data['trainData'][i]
            new_point['predictions'] = {}
            new_point['predictions']['linear'] = float(full_data['linearPredictions'][i])
            new_point['predictions']['rforest'] = float(full_data['rforestPredictions'][i])
            if 'classification' in request.POST:
                new_point['scores'] = {}
                new_point['scores']['linear'] = max(min(1, float(full_data['linearScore'][i])), 0)
                new_point['scores']['logistic'] = full_data['logisticScore'][i]
                new_point['scores']['rforest'] = max(min(1, float(full_data['rforestScore'][i])), 0)
            new_point['trueVal'] = float(new_data[-1])
            if predictions:
                new_point['userPredicted'] = predictions[i]
            response_data.append(new_point)

        return JsonResponse({"colNames": names, "dataPoints": response_data})

        # return JsonResponse(full_data)
    else:
        return HttpResponse("Nope")


def upload_prediction(request):
    return JsonResponse({})







def parse_file(f):
    if f is None:
        return None

    names = None

    data = []
    for line in f:
        if not names:
            names = line.decode('utf-8').strip().split(',')
        else:
            newline = line.decode('utf-8').strip().split(',')

            for i in range(len(newline)):
                if not newline[i]:
                    newline[i] = "NA"

            if len(newline) == 1:
                newline = newline[0]
            data.append(newline)

    return names, data


def split_data(data):
    train_data     = []
    train_results  = []
    predict_data   = []

    for line in data:
        if line[-1] is not "NA":
            train_data.append([float(e) for e in line[:-1]])
            train_results.append(float(line[-1]))
        predict_data.append([float(e) for e in line[:-1]])

    return train_data, train_results, predict_data


def parse_predictions(pfile):
    predictions = []

    name = None

    for line in pfile:
        l = line.decode('utf-8').strip()
        if not name:
            name = l
        else:
            if len(l) > 0:
                predictions.append(float(l))
            else:
                predictions.append("NA")

    return predictions



def linear_prediction(data):
    # TODO(tfs): How do we split up test/train? How do we handle their predictions, similarly?
    train_data, train_outcomes, predict_data = split_data(data)

    linreg = LinearRegression()
    linreg.fit(train_data, train_outcomes)
    predictions = linreg.predict(predict_data)

    return predictions


def class_prediction(data):
    train_data, train_classes, predict_data = split_data(data)

    logreg = LogisticRegression()
    logreg.fit(train_data, train_classes)
    predictions = logreg.predict(predict_data)

    return predictions


def logistic_score(data):
    train_data, train_classes, predict_data = split_data(data)

    logreg = LogisticRegression()
    logreg.fit(train_data, train_classes)
    probs = logreg.predict_proba(predict_data)

    return [p[1] for p in probs]


def rforest_classification(data):
    train_data, train_classes, predict_data = split_data(data)

    # TODO(tfs): Uses default hyperparameters currently. How do we handle this?
    rf = RandomForestClassifier()
    rf.fit(train_data, train_classes)
    predictions = rf.predict(predict_data)

    return predictions


def rforest_regression(data):
    train_data, train_outcomes, predict_data = split_data(data)

    # TODO(tfs): Same as above
    rf = RandomForestRegressor()
    rf.fit(train_data, train_outcomes)
    predictions = rf.predict(predict_data)

    return predictions


# def bin_scores_and_outcomes(data, scoring_name, num_bins):
#     positive_bins = []
#     negative_bins = []
#     score_bins = []
#     counts = []
#     pairs = []

#     for point in data:
#         outcome = point["trueVal"]
#         score = point["scores"][scoring_name]
#         pair = (score, outcome)

#         pairs.append(pair)

#     sorted_pairs = sorted(pairs, key=lambda x: x[0])

#     n = len(sorted_pairs)

#     for i in range(n-1):
#         tmp_scores = []
#         positive_bins.append(0)
#         negative_bins.append(0)
#         counts.append(0)

#         for j in range(int(i * (n / num_bins)), int((i+1) * (n / num_bins))):
#             tmp_scores.append(pairs[j][0])

#             if pairs[j][1] > 0:
#                 positive_bins[i] += 1
#             else:
#                 negative_bins[i] += 1

#             counts[i] += 1

#         score_bins.push(np.mean(tmp_scores))

#     tmp_scores = []
#     counts.append(0)
#     positive_bins.append(0)
#     negative_bins.append(0)

#     for i in range(int((n-1) * (n / num_bins)), n):
#         tmp_scores.append(pairs[i][0])

#         if pairs[i][1] > 0:
#             positive_bins[-1] += 1
#         else:
#             negative_bins[-1] += 1

#         counts[-1] += 1

#     score_bins.push(np.mean(tmp_scores))

#     return score_bins, positive_bins, negative_bins, counts


# def check_calibration(data, scoring_name, num_bins):
#     scores, pos, neg, counts = bin_scores_and_outcomes(data, scoring_name, num_bins)

#     stat = 0

#     for i in range(len(scores)):
#         numer = (pos[i] - (scores[i]*counts[i]))
#         numer *= 2

#         denom = (scores[i] * counts[i]) * max(0, (1 - scores[i]))

#         stat += numer / denom

#     return None














    

    