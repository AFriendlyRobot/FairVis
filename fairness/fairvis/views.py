import json

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

def upload(request):
    if request.method == 'POST':
        # nfile = request.FILES['namefile']
        # names = parse_file(nfile)

        dfile = request.FILES['datafile']
        names, data = parse_file(dfile)

        full_data = {}
        full_data['nameData'] = names
        full_data['trainData'] = data

        # parsed_name_file = parse_file(nfile)
        # parsed_name_file, parsed_data_file = parse_file(dfile)

        # If "classification" checked
        if 'classification' in request.POST:
            full_data['linearPredictions']  = class_prediction(data).tolist()
            full_data['rforestPredictions'] = rforest_classification(data).tolist()
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
                new_point['data'][names[j]] = new_data[j]
            # new_point['data'] = full_data['trainData'][i]
            new_point['predictions'] = {}
            new_point['predictions']['linear'] = full_data['linearPredictions'][i]
            new_point['predictions']['rforest'] = full_data['rforestPredictions'][i]
            new_point['trueVal'] = new_data[-1]
            response_data.append(new_point)

        return JsonResponse({"colNames": names, "dataPoints": response_data})

        # return JsonResponse(full_data)
    else:
        return HttpResponse("Nope")





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

    

    