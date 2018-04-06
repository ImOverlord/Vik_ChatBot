#! /usr/bin/env python3
# Author: ARNAUD (Martient) LEHERPEUR
#	PROJECT: VIK

from PIL import Image, ImageFont, ImageDraw
import json
import time
import requests
import os
import sys

url = "http://api.openweathermap.org/data/2.5/forecast?q=toulouse&mode=json&appid=d52a623a3455f971d98e26ca724d3d93"
font = ImageFont.truetype("./arial.ttf", 16)

def get_time():
	return (time.time())

def create_image(id, argv):
	time_ = get_time() - 60 #In case scripts stats late
	count = 0

	#r = requests.post(url,stream=True)
	weather_parser = json.loads(argv)
	weather = weather_parser
	today = Image.new("RGB", (200, 1 * 60))
	today.paste( (255,255,255), [0,0,today.size[0],today.size[1]])
	time_text = time.strftime('%H:%M', time.localtime(weather['time'] - 60*60))
	posx = 60
	posy = count * 60
	tempe = weather['temp']
	tempe = str(tempe) + "°C"
	desc = weather['description']
	f = open( str(count) + '.png','wb')
	f.write(requests.get(weather['img'] + '.png').conten)
	f.close()
	temp = Image.open(str(count) + '.png')
	today.paste(temp, (posx, posy))
	draw = ImageDraw.Draw(today)
	draw.text((posx + 60, posy + 3), tempe, (0,0,0), font=font)
	draw.text((posx + 60, posy + 25), desc, (0,0,0), font=font)
	draw.text((0, posy + (30-16)), time_text, (0,0,0), font=font)
	count += 1
	today.save(id + 'weather_' + time_text + '.png')
	cleanup()

def cleanup():
	i = 0
	while (i < 8):
		os.remove(str(i) + ".png")
		i += 1

create_image(sys.argv[1], sys.argv[2])



# blank_image = Image.new("RGB", (800, 600))
# blank_image.save("blank.jpg")
