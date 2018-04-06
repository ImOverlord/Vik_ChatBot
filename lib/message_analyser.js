let User = require("../models/user");
let mongoose = require("mongoose");
let request = require("request");
let facebook = require("./facebook");
let card = require("./card_battle");
let weather = require("./weather");
let planner = require("./planner");
let token_system = require("./token_system");
let config;
let APP_SECRET;
let VALIDATION_TOKEN;
let PAGE_ACCESS_TOKEN;
let SERVER_URL;


var greetings = ['hey', 'hello', 'hi'];
var add = ['new', 'add', 'create'];

var schedule_word = ['schedule', 'planner', 'agenda'];
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
	token_system = require("./token_system");
	APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? 
	process.env.MESSENGER_APP_SECRET :
	config.get('appSecret');

	// Arbitrary value used to validate a webhook
	VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
	(process.env.MESSENGER_VALIDATION_TOKEN) :
	config.get('validationToken');

	// Generate a page access token for your page from the App Dashboard
	PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
	(process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
	config.get('pageAccessToken');

	// URL where the app is running (include protocol). Used to point to scripts and 
	// assets located at this address. 
	SERVER_URL = (process.env.SERVER_URL) ?
	(process.env.SERVER_URL) :
	config.get('serverURL');

	if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
		console.error("Missing config values");
		process.exit(1);
	}
}

function analyse_message(senderID, messageText)
{
	console.log("%d: %s", senderID, messageText);
	messageText = messageText.toLowerCase();
	var string = split_message(messageText);

	if (contains(string, "card")) {
		card.card_main(senderID, string);
	}
	if (contains(string, "weather")) {
		weather.main_weather(senderID, string);
	}
	if (contains(string, "epitech")) {
		facebook.sendTextMessage(senderID, "Setup your Epitech account with Vik by modifying the settings");
	}
	if (contains(string, "settings")) {
		send_settings(senderID);
	}
	if (category_match(string, schedule_word) && category_match(string, add)) {
		show_planner(senderID);
	} if (category_match(string, schedule_word)) {
		planner.main_planner(senderID, string);
	}
	if (category_match(string, greetings)) { 
		var new_greetings = greetings[Math.floor(Math.random() * greetings.length)]; 
		facebook.sendTextMessage(senderID, nice_string(new_greetings)); 
	} 
	if (contains(string, "token")) {
		token_system.token_main(senderID, string);
	} 
	facebook.sendReadReceipt(senderID);
}

function contains(stack, needle)
{
	var max = stack.length;
	var i = 0;

	while (i < max) {
		if (stack[i] == needle) {
			return (true);
		}
		i++;
	}
	return (false);
}

function category_match(string, category)
{
	var i = 0;
	var i_max = string.length;
	var j = 0;
	var j_max = category.length;

	while (i < i_max) {
		j = 0;
		while (j < j_max) {
			if (string[i] == category[j]) {
				return (true);
			}
			j++;
		}
		i++;
	}
	return (false);
}

function category_match_plus(string, category) 
{ 
	var i = 0; 
	var i_max = string.length; 
	var j = 0; 
	var j_max = category.length; 
	
	while (i < i_max) { 
		j = 0; 
		while (j < j_max) { 
			if (string[i] == category[j]) { 
				return (category[j]); 
			} 
			j++; 
		} 
		i++; 
	} 
	return (false); 
}

function split(string, i1, i2)
{
	var new_string = "";
	while (i1 < i2) {
		new_string += string[i1];
		i1++;
	}
	return (new_string);
}

function split_message(string)
{
	var array = [];
	var i = 0;
	var old_i = 0;
	while (i < string.length) {
		if (string[i] == ' ' && string[i + 1] != ' ') {
			array.push(split(string, old_i, i));
			old_i = i+1;
		}
		i++;
	}
	array.push(split(string, old_i, i));
	return (array);
}

function create_user(senderID, messageText)
{
	var newUser = User({
		user_id: senderID,
		name: "John Doe"
	})
	newUser.save(function(err) {
		if (err) throw err;
		update_name(senderID, messageText);
	})
}

function check_if_new_user(senderID,messageText)
{
	User.findOne({user_id: senderID}, function (err, user) {
		if (user == null) {
			create_user(senderID, messageText);
		} else {
			analyse_message(senderID, messageText);
		}
	})
}

function update_name(senderID, messageText)
{
	User.findOne({user_id: senderID}, function(err, user) {
		if (user == null) {
			console.log("Error: Tried to get the name of a user that doesn't exist");
		} else {
			request({
				uri: 'https://graph.facebook.com/' + senderID + '?access_token=' + PAGE_ACCESS_TOKEN,
				method: 'GET',
			}, function (error, response, body) {
				body = JSON.parse(body);
				console.log(body);
				user.first_name = body.first_name;
				user.last_name = body.last_name;
				user.save(function(err) {
					if (err) throw err;
					analyse_message(senderID, messageText);
				})
			});
		}
	})
}

function send_settings(senderID)
{
	var messageData = {
		recipient: {
		  id: senderID
		},
		message: {
		  attachment: {
		    type: "template",
		    payload: {
		      template_type: "button",
		      text: "Change User Settings",
		      buttons:[{
			type: "web_url",
			url: SERVER_URL + "./settings?id=" + senderID,
			title: "Open Web URL"
		      }]
		    }
		  }
		}
	};
	facebook.callSendAPI(messageData);
}

function show_planner(senderID)
{

	var messageData = {
		recipient: {
		  id: senderID
		},
		message: {
		  attachment: {
		    type: "template",
		    payload: {
		      template_type: "button",
		      text: "Added a new plan",
		      buttons:[{
			type: "web_url",
			url: SERVER_URL + "./planning?id=" + senderID,
			title: "Open Web URL"
		      }]
		    }
		  }
		}
	};
	facebook.callSendAPI(messageData);
}

function nice_string(string) 
{ 
	var i = 1;
	var new_string;
	new_string = string[0].toUpperCase();
	
	while (i < string.length) {
	new_string += string[i];
	i++;
	}
	return (new_string)
}

module.exports = {
	analyse_message,
	check_if_new_user,
	contains,
	category_match,
	category_match_plus,
	init
}