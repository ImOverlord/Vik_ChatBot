let User = require("../models/user");
let mongoose = require("mongoose");
let request = require("request");
let facebook = require("./facebook");
let card = require("./card_battle");
let weather = require("./weather");
let planner = require("./planner");
 
function init()
{ 
	User = require("../models/user");
	mongoose = require("mongoose");
	request = require("request");
	facebook = require("./facebook");
	card = require("./card_battle");
	config = require("config");
	weather = require("./weather");
	planner = require("./planner");
}
 
 
function token_main(senderID, string)
{ 
	if (string.length == 1){ 
		show_token_help(senderID);
	}
}

function show_token_help(senderID)
{ 
	var resp = "";
	User.findOne({user_id: senderID}, function (err, user){ 
		if (err)throw err;
		console.log(user.settings);
		if (user == null){ 
			console.log("Error");
		}
		if (user.settings.epitech_url == ''){ 
			resp = "Seems you didnt configure your Epitech account with us, you can do so by configurin the settings";
		}else { 
			facebook.sendTextMessage(senderID, "Checking for eligble token this may take some time");
			get_eligble_tokens(user);
		}
	})
}
 
function get_eligble_tokens(user)
{ 
	var date = new (Date);
	var month = ('0' + (date.getMonth()+1)).slice(-2)
	var day  = ('0' + (date.getDate())).slice(-2)
	var today = date.getFullYear()+ "-" + month + "-" + day;
	console.log(today);
	request({ 
		uri: user.settings.epitech_url + "/planning/load?format=json", 
		method: 'GET', 
	}, function (error, response, body){ 
		if (error)throw error;
		body = JSON.parse(body);

		var eligble_acti = [];
		body.forEach(element => { 
			if (check_if_same_day(element.start, today)) {
				console.log(element.event_registered);
				if (element.event_registered == "present"){ 
		eligble_acti.push(element);
				}
			}
		});
		user.tokens.count = eligble_acti.length;
		user.save(function(err){ 
			if (err)throw err;
			facebook.sendTextMessage(user.user_id, "You have " + user.tokens.count + " token that can be used to play");
		})
	});
	}

function check_if_same_day(string, date)
{ 
	var i = 0;
	new_string = "";
	while (string[i] != " ") {
		new_string += string[i];
		i++;
	}
	if (new_string == date) {
		return (true);
	}
	return (false);
}
 
module.exports = {
	init,
	token_main
}