import json

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.template import loader

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
        dfile = request.FILES['datafile']
        response_data = {}
        response_data['contents'] = []
        for line in dfile.open():
            response_data['contents'].append(line.decode('utf-8').strip().split(','))
        return JsonResponse(response_data)
    else:
        return HttpResponse("Nope")

    

    