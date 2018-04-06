#! /usr/bin/env python3
from PIL import Image, ImageFont, ImageDraw
import json
import time
import requests
import sys

font = ImageFont.truetype("./python_scripts/arial.ttf", 16)

def read(id):
	f = open("./data/" + id + "_planner.json", "r")
	data = json.loads(f.read())
	data = data['planner']
	width = get_longest(data)
	t = find_smallest(data)
	if (t == 0):
		print("NULL")
		return
	i = 0
	posx = 0
	posy = 0
	width = int((16 * width)/2) + 200
	planner = Image.new("RGB", (width, (len(data) + 1) * 20))
	while (t != 0):
		draw = ImageDraw.Draw(planner)
		draw.text((posx, posy), t['start'], (255,255,255), font=font)
		draw.text((posx+170, posy), t['acti_title'], (255,255,255), font=font)
		draw.text((width - 16*3, posy), t['room']['code'], (255,255,255), font=font)
		t = find_smallest(data)
		posy += 20
	planner.save(id + "_plan.png")

def get_longest(obj):
	i = 0
	size = 0

	while (i < len(obj)):
		if (len(obj[i]['acti_title']) > size):
			size = len(obj[i]['acti_title'])
		i += 1
	return (size)


def find_smallest(obj):
	i = 0
	max = len(obj)
	if (max == 0):
		return 0
	smallest = int(time.mktime(time.strptime(obj[i]['start'], '%Y-%m-%d %H:%M:%S'))) - time.timezone
	smallest_id = i
	while (i < max):
		date = int(time.mktime(time.strptime(obj[i]['start'], '%Y-%m-%d %H:%M:%S'))) - time.timezone
		if (date < smallest):
			smallest = date
			smallest_id = i
		i+= 1
	temp = obj[smallest_id]
#	print(obj[smallest_id]['acti_title'])
	del obj[smallest_id]
	return temp

if (len(sys.argv) != 2):
	sys.exit(84)
read(sys.argv[1])