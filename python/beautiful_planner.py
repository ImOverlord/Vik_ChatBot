#! /usr/bin/env python3
from PIL import Image, ImageFont, ImageDraw
import json
import time
import requests
import sys

font = ImageFont.truetype("./python/arial.ttf", 16)

space = 200
id = sys.argv[1]

def drawer(id):
	i = 0
	f = open(sys.argv[2], "r")
	obj = json.loads(f.read())
	posx = 0
	posy = 0
	width = get_longest(obj)
	width = int((width + 50))
	if (len(obj) == 0):
		width = len("You have nothing scheduled for today")
	planner = Image.new("RGB", (width, (len(obj) + 1) * 20))
	if (len(obj) == 0):
		planner = Image.new("RGB", (300, 30))
		draw = ImageDraw.Draw(planner)
		draw.text((0, 0), "You have nothing scheduled for today", (255,255,255), font=font)
	while (i < len(obj)):
		draw = ImageDraw.Draw(planner)
		draw.text((posx, posy), obj[i]['start'], (255,255,255), font=font)
		posx = posx+len(obj[i]['start'])+space
		draw.text((posx, posy), obj[i]['end'], (255,255,255), font=font)
		posx = posx+len(obj[i]['end'])+space
		draw.text((posx, posy), obj[i]['title'], (255,255,255), font=font)
		posx = posx+len(obj[i]['title'])+space
		draw.text((posx, posy), obj[i]['detail'], (255,255,255), font=font)
		posx = posx+len(obj[i]['detail'])+space
		draw.text((posx, posy), obj[i]['location'], (255,255,255), font=font)
		i += 1
		posy += 20
		posx = 0
	planner.save('./public/' + id + "_plan.png")

def get_longest(obj):
	i = 0
	full_length = 0
	longest = 0

	while (i < len(obj)):
		full_length = len(obj[i]['start']) + len(obj[i]['end']) + len(obj[i]['title']) + len(obj[i]['detail']) + len(obj[i]['location']) + (space * 4)
		if (full_length > longest):
			longest = full_length
		i += 1
	return (longest)

drawer(id)