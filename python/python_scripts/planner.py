#! /usr/bin/env python3
import requests
import json
import os
import time

cookie = {"user": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpbiI6InRoaWJhdWx0LWFsZXhhbmRyZS5mYXVyZUBlcGl0ZWNoLmV1IiwidHoiOm51bGwsImV4cCI6MTUxMzI5MTE5Mn0.OGBWQr_9w-DVdXSzMpGRMZfkdpOC4cD8swekuEUq4Rg"}
url = "https://intra.epitech.eu/auth-d82c3d5927d781603ebbca8eeae5302a37df5873"
url_planner = "https://intra.epitech.eu/planning/load?format=json&start=2017-12-11&end=2017-12-17"

def pretty_print(room, start):
	i = 0
	while (room[i] != '/'):
		i+=1
	module = room[:i]
	salle = room[i+1:]
	print(module + "  \t" + salle + "\t" + start)
	return (salle)


def get_time_start():
	epoch = time.time()
	weekday = time.strftime("%w", time.localtime(epoch))
	epoch = time.time() - (86400 * (int(weekday)-1))
	return (time.strftime("%Y-%m-%d", time.localtime(epoch)))

def get_time_end():
	epoch = time.time()
	weekday = time.strftime("%w", time.localtime(epoch))
	epoch = time.time() - (86400 * (int(weekday)-1))
	epoch = epoch + 86400*6
	return (time.strftime("%Y-%m-%d", time.localtime(epoch)))

def get_user_id():
	file = open("data/user_planner.json", "r") 
	data = json.loads(file.read())
	return (data['id'])

def get_planner(id, url):
	start = get_time_start()
	end = get_time_end()
	url_planner = "https://" + url + "/planning/load?format=json&start=" + start +"&end=" + end
	r = requests.post(url_planner,stream=True, cookies=cookie)
	print(r.status_code)
	plan = json.loads(r.text)
	length = len(plan)
	i = 0
	while i < len(plan):
		if (plan[i]['event_registered']) == "registered":
			plan[i]['room']['code'] = pretty_print(str(plan[i]['room']['code']).replace("FR/TLS/", ""), str(plan[i]['start']))
			i += 1
		else:
			del plan[i]
	reformat = { "id": id, "planner": []}
	reformat["planner"] = plan
	with open('data/' + id + '_planner.json', 'w') as outfile:
		json.dump(reformat, outfile)

def create_empty(id):
	reformat = { "id": id, "planner": []}
	with open('data/' + id + '_planner.json', 'w') as outfile:
		json.dump(reformat, outfile)

def get_urls():
	file = open("data/account_list.json", "r") 
	data = json.loads(file.read())
	i = 0
	while (i < len(data['users'])):
		if (len(data['users'][i]['epitech_url']) != 0):
			get_planner(data['users'][i]['id'], data['users'][i]['epitech_url'])
		else:
			create_empty(data['users'][i]['id'])
		i += 1


get_urls()