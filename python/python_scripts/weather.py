#! /usr/bin/env python3

from PIL import Image, ImageFont, ImageDraw
import json
import time
import requests
import os

url = "http://api.openweathermap.org/data/2.5/forecast?q=toulouse&mode=json&appid=d52a623a3455f971d98e26ca724d3d93"
font = ImageFont.truetype("./python_scripts/arial.ttf", 16)

def get_time():
	return (time.time())

def create_image():
	time_ = get_time() - 60 #In case scripts stats late
	count = 0

	r = requests.post(url,stream=True)
	test = json.loads(r.text)
	weather = test['list']
	today = Image.new("RGB", (200, 8 * 60))
	today.paste( (255,255,255), [0,0,today.size[0],today.size[1]])
	while (count < 8):
		time_text = time.strftime('%H:%M', time.localtime(weather[count]['dt'] - 60*60))
		posx = 60
		posy = count * 60
		tempe = round(weather[count]['main']['temp'] -273.15, 1)
		tempe = str(tempe) + "°C"
		desc = weather[count]['weather'][0]['description']
		f = open( str(count) + '.png','wb')
		f.write(requests.get('http://openweathermap.org/img/w/' + weather[count]['weather'][0]['icon'] + '.png').content)
		f.close()
		temp = Image.open(str(count) + '.png')
		today.paste(temp, (posx, posy))
		draw = ImageDraw.Draw(today)
		draw.text((posx + 60, posy + 3), tempe, (0,0,0), font=font)
		draw.text((posx + 60, posy + 25), desc, (0,0,0), font=font)
		draw.text((0, posy + (30-16)), time_text, (0,0,0), font=font)
		count += 1
	today.save("main.png")
	cleanup()

def cleanup():
	i = 0
	while (i < 8):
		os.remove(str(i) + ".png")
		i += 1
create_image()



# blank_image = Image.new("RGB", (800, 600))
# blank_image.save("blank.jpg")