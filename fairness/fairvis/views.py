import json

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.template import loader

from sklearn.linear_model import LinearRegression

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
        nfile = request.FILES['namefile']
        names = parse_file(nfile)
        dfile = request.FILES['datafile']
        data = parse_file(dfile)
        # TODO(tfs): Not yet handling their internal prediction file (conditionally)
        response_data = {}
        response_data['nameFile'] = names
        response_data['dataFile'] = data
        response_data['linregPredictions'] = linear_prediction(parse_file(dfile)).tolist()
        return JsonResponse(response_data)
    else:
        return HttpResponse("Nope")





def parse_file(f):
    if f is None:
        return None

    data = []
    for line in f:
        newline = line.decode('utf-8').strip().split(',')

        for i in range(len(newline)):
            if not newline[i]:
                newline[i] = "NA"

        if len(newline) == 1:
            newline = newline[0]
        data.append(newline)

    return data




def linear_prediction(data):
    # TODO(tfs): How do we split up test/train? How do we handle their predictions, similarly?
    train_data     = []
    train_outcomes = []
    predict_data   = []


    for line in data:
        if line[-1] is not "NA":
            print(line)
            train_data.append([float(e) for e in line[:-1]])
            train_outcomes.append(float(line[-1]))
        predict_data.append([float(e) for e in line[:-1]])


    print(train_data)
    print(train_outcomes)
    print(predict_data)

    linreg = LinearRegression()
    fit = linreg.fit(train_data, train_outcomes)
    predictions = linreg.predict(predict_data)

    return predictions

    

    