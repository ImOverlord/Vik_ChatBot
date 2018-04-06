#! /usr/bin/env python3
# Author: ARNAUD (Martient) LEHERPEUR
#	PROJECT: VIK

from PIL import Image, ImageFont, ImageDraw
import json
import time
import requests
import os
import sys
import random

def get_time():
	return (time.time())

def token_random_return(arg):
	file = open(arg, "r")
	token_get_file = json.loads(file.read())
	token_list = token_get_file

	loto_final = Image.new("RGB", (200, 1 * 60))
	loto_final.paste( (255,255,255), [0,0,loto_final.size[0],loto_final.size[1]])

	i = 0
	while i < len(token_list):
		posx = 60
		posy = count * 60
		owner_id = token_list[i]['id']
		token = token_list[i]['token_status']
		if token == 0:
			token = -1 + "NO VALIDATE SESSION"
			pass
		f = open( str(count) + '.png','wb')
		f.close()
		temp = Image.open(str(count) + '.png')
		loto_final.paste(temp, (posx, posy))
		draw = ImageDraw.Draw(loto_final)
		draw.text((posx + 60, posy + 3), owner_id, (0,0,0), font=font)
		draw.text((posx + 60, posy + 25), token, (0,0,0), font=font)
		i += 1
		pass
	token_winner(token_list)
	loto_final.save('loto_list_player' + '.png')
	cleanup()
	pass

def token_winner(obj):
	max = len(obj)
	win = random.randint(0,max)
	if (obj[win]['token_status'] == 0)
		token_winner(obj)
	token_winner_img = Image.new("RGB", (200, 1 * 60))
	token_winner_img.paste( (255,255,255), [0,0,token_winner_img.size[0],token_winner_img.size[1]])
	f = open('winner_' + obj[win]['id'] + '.png', 'wb')
	f.close()
	final_file = Image.open('winner_' + obj[win]['id'] + '.png')
	token_winner_img.paste(final_file, (posx, posy))
	draw = ImageDraw.Draw(token_winner_img)
	congratulate = "Congratulate you win with"
	draw.text((posx + 60, posy + 3), congratulate, (0,0,0), font=font)
	draw.text((posx + 60, posy + 25), token, (0,0,0), font=font)
	token_winner_img.save('loto_winner' + '.png')
	os.remove('winner_' + obj[win]['id'] + ".png")
	pass

def cleanup():
	os.remove(str(0) + ".png")
	os.remove(sys.argv[2])

token_random_return(sys.argv[1])
