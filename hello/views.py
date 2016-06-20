from django.shortcuts import render, render_to_response
import urllib
import json
from django.http import HttpResponse
from django.template import RequestContext
import requests
import requests_cache
from collections import OrderedDict

requests_cache.install_cache('coursera', expire_after=86400)


def home(request):
    return render(request, 'index.html')


def count(obj):
    return int(obj["count"])


def search_result(request):
    if request.method == "GET" or request.method == "POST":
        query = request.GET.get("query")
        start = request.GET.get("start", 0)
        availability = request.GET.getlist('Availability')
        domains = request.GET.getlist('Domain')
        subtitleLanguages = request.GET.getlist('Subtitle')
        primaryLanguages = request.GET.getlist('Language')
        api = "https://api.coursera.org/api/courses.v1?q=search&start=" + \
            str(start) + \
            "&limit=10&includes=instructorIds,partnerIds" + \
            "&fields=slug,courseType,photoUrl,instructorIds,partnerIds," + \
            "instructors.v1(firstName,lastName,suffix)," + \
            "partners.v1(logo)&query=" + \
            query
        if len(availability) != 0:
            api += "&availability="
            for a in availability:
                api += a + ","
            api = api[:-1]
        if len(domains) != 0:
            api += "&domains="
            for a in domains:
                api += a + ","
            api = api[:-1]
        if len(subtitleLanguages) != 0:
            api += "&subtitleLanguages="
            for a in subtitleLanguages:
                api += a + ","
            api = api[:-1]
        if len(primaryLanguages) != 0:
            api += "&primaryLanguages="
            for a in primaryLanguages:
                api += a + ","
            api = api[:-1]
        r = requests.get(api)
        results = r.json()
        result = []
        l = len(results["elements"])
        ins = results["linked"]["instructors.v1"]
        ll = len(ins)
        ins_dic = dict()
        for i in range(0, ll):
            firstName = ins[i]['firstName']
            lastName = ins[i]['lastName']
            fullName = ins[i]['fullName']
            t = dict()
            if fullName != "":
                t['insName'] = fullName
            else:
                t['insName'] = firstName + " " + lastName
            ins_dic[ins[i]['id']] = t

        part = results["linked"]["partners.v1"]
        pl = len(part)
        part_dic = dict()
        for i in range(0, pl):
            partname = part[i]['name']
            try:
                logo = part[i]['logo']
            except:
                logo = ""
            t = dict()
            t['partname'] = partname
            t['logo'] = logo
            part_dic[part[i]['id']] = t

        for i in range(0, l):
            name = results["elements"][i]['name']
            photo = results["elements"][i]['photoUrl']
            inst = results["elements"][i]['instructorIds']
            slug = results["elements"][i]['slug']
            courseType = results["elements"][i]['courseType']
            instructor = []
            for j in range(0, len(inst)):
                if j == 2:
                    break
                instruct = ins_dic[inst[j]]
                instructor.append(instruct)
            pid = results["elements"][i]["partnerIds"][0]
            partner = part_dic[pid]
            result.append(
                {"name": name, "photo": photo, "instructor": instructor,
                 "partner": partner, "slug": slug, "courseType": courseType})

        facet = dict()
        f = results["paging"]["facets"]
        farr = {"Availability":"availability","Subtitle":"subtitleLanguages","Domain":"domains","Language":"primaryLanguages"}
        for a,v in farr.iteritems():
            tm = f[v]["facetEntries"]
            tm.sort(key=count, reverse=True)
            facet[a] = tm

        facet = OrderedDict(sorted(facet.items(), key = lambda(k,v):(k,v)))
        availability = availability
        domains = domains
        primaryLanguages = primaryLanguages
        subtitleLanguages = subtitleLanguages
        try:
            next = int(results["paging"]["next"])
        except:
            next = -1
        total = results["paging"]["total"]
        res = {"next": next, "total": total, "facet": facet,
               "query": query, "result": result, "availability": availability,
               "domains": domains, "primaryLanguages": primaryLanguages,
               "subtitleLanguages": subtitleLanguages}
        return res


def searchAjax(request):
    return HttpResponse(json.dumps(search_result(request)),
                        content_type='application/json')


def search(request):
    res = search_result(request)
    return render_to_response('search.html', res,
                              context_instance=RequestContext(request))
