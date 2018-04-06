const bodyParser = require('body-parser');
const config = require('config');
const crypto = require('crypto');
const express = require('express');
const https = require('https');
const request = require('request');
const mongoose = require("mongoose");
var schedule = require('node-schedule');
let token_system = require("./lib/token_system");
 
let User = require("./models/user");
let facebook = require("./lib/facebook");
let msg = require("./lib/message_analyser");
let card = require("./lib/card_battle");
let weather = require("./lib/weather");
let planner = require("./lib/planner");
var app = express();
mongoose.connect('mongodb://localhost/vik_test_db');
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: facebook.verifyRequestSignature }));
app.use(express.static('public'));
 
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
	msg.init();
	facebook.init();
	card.init();
	weather.init();
	planner.init();
	token_system.init();
	disply_users();
	testing();
	//planner.get_week_plan(1582000468563204);
	//planner.save_epitech(1582000468563204);
});

app.get('/settings', function(req, res) {
	if (req.query.id != undefined)
		res.render("index.ejs", {user_id : req.query.id});
	else
		res.sendStatus(404);
})

app.get('/planning', function(req, res) {
	if (req.query.id != undefined)
		res.render("planning.ejs", {user_id : req.query.id});
	else
		res.sendStatus(404);
})

app.get('/webhook', function(req, res) {
	if (req.query['hub.mode'] === 'subscribe' &&
		req.query['hub.verify_token'] === "overlord") {
		console.log("Validating webhook");
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);
	}
});

app.post('/webhook', function (req, res) {
	var data = req.body;
 
	if (data.object == 'page') {
		data.entry.forEach(function(pageEntry) {
			var pageID = pageEntry.id;
			var timeOfEvent = pageEntry.time;
 
			pageEntry.messaging.forEach(function(messagingEvent) {
				if (messagingEvent.optin) {
					facebook.receivedAuthentication(messagingEvent);
				} else if (messagingEvent.message) {
					receivedMessage(messagingEvent);
				} else if (messagingEvent.delivery) {
					facebook.receivedDeliveryConfirmation(messagingEvent);
				} else if (messagingEvent.postback) {
					facebook.receivedPostback(messagingEvent);
		} else if (messagingEvent.read) {
					facebook.receivedMessageRead(messagingEvent);
				} else if (messagingEvent.account_linking) {
					facebook.receivedAccountLink(messagingEvent);
				} else {
					console.log("Webhook received unknown messagingEvent: ", messagingEvent);
				}
			});
		});
	res.sendStatus(200);
	}
});

function receivedMessage(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;
	var isEcho = message.is_echo;
	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;
 
	// You may get a text or attachment but not both
	 var messageText = message.text;
	var messageAttachments = message.attachments;
	var quickReply = message.quick_reply;
 
	if (messageAttachments) {
		if (messageAttachments[0].type == "location") {
			console.log("Received Coordiantes");
			weather.add_location(senderID, messageAttachments[0]);
		}
	} else if (isEcho) {
		console.log("Message was an echo.");
		return;
	} else if (quickReply) {
		var quickReplyPayload = quickReply.payload;
		console.log("Quick reply for message %s with payload %s",
		messageId, quickReplyPayload);
 
		facebook.sendTextMessage(senderID, "Quick reply tapped");
		return;
	} else if (messageText) {
		msg.check_if_new_user(senderID, messageText);
	} else {
		console.log("Message not recongnized");
	}
}

function disply_users()
{
	User.find({}, function(err, users) {
		console.log(users.length);
		users.forEach(user => {
			
		})
	})
 
}

function convertEpochToSpecificTimezone(epoch, offset){
	var d = new Date(epoch);
	var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
	var nd = new Date(utc + (3600000*offset));
	return nd.toLocaleString();
}

function testing()
{
	var senderID = "1582000468563204";
 
	User.find({}, function(err, users) {
		users.forEach(user => {
			var milliseconds = (new Date).getTime();
			var user_time = (new Date);
			var utc = user_time.getTime() + (user_time.getTimezoneOffset() * 60000);
			user_time = new Date(utc + (3600000*user.location.timezone));
			var h = user_time.getHours();
			var m = user_time.getMinutes();
			if (h == 0 && m == 0 && user.location != {}) {
				console.log("Its Midnight for " + user.first_name);
				//weather.update_10_weather(user.user_id);
				weather.update_today_weather(user.user_id);
			}
		})
	})
}

var j = schedule.scheduleJob('* */1 * * *', function(){
	User.find({}, function(err, users) {
		users.forEach(user => {
			var milliseconds = (new Date).getTime();
			var user_time = (new Date);
			var utc = user_time.getTime() + (user_time.getTimezoneOffset() * 60000);
			user_time = new Date(utc + (3600000*user.location.timezone));
			var h = user_time.getHours();
			var m = user_time.getMinutes();
			if (h == 0 && m == 0) {
				weather.update_today_weather(user.user_id);
				console.log("Its Midnight for " + user.first_name);
			}
		})
	})
});


var j = schedule.scheduleJob('*/1 * * * *', function(){
	User.find({}, function(err, users) {
		users.forEach(user => {
			var milliseconds = (new Date);
			var h = milliseconds.getHours();
			var m = milliseconds.getMinutes();

			if (user.settings.h == h && user.settings.m == m) {
				if (user.location.length != undefined) {
					weather.get_today_weather(user.user_id);
				}
				planner.planner_get_today(user.user_id);
			}
			console.log(user.first_name + " is being checked")
			//console.log(user.planner);
			planner.check_if_new_notification(user);
		})
	})
});

app.get("/vik_api_get", function(req, res) {
	if (req.query.id != undefined) {
		User.findOne({user_id: req.query.id}, function(err, user) {
			if (user == null) {
				res.sendStatus(404);
			} else {
				string = user.settings;
				string = JSON.stringify(string);
				res.send(string);
			}
		});
	}
})

app.get("/vik_api", function(req, res) {
	var id;
	var data;
	if (req.query.id != undefined && req.query.data != undefined) {
		id = req.query.id
		data = req.query.data;
		User.findOne({user_id: id}, function (err, user) {
			if (user == null) {
				res.sendStatus(404);
			} else {
				save_settings(user, data, res);
				
			}
		})
	} else {
		res.sendStatus(401);
	}
})

app.get("/vik_api_planner", function(req, res) {
	var id;
	var data;
	if (req.query.id != undefined && req.query.data != undefined) {
		User.findOne({user_id:req.query.id}, function (err, user) {
			console.log(err);
			if (user == null) {
				console.log(req.query.id);
				res.sendStatus(404);
			} else {
				//save_settings(user, data, res);
				console.log(req.query.data);
				planner.add_to_planner(user, JSON.parse(req.query.data));
				res.sendStatus(200);
			}
		})
	} else {
		res.sendStatus(401);
	}
})

function save_settings(user, data, res)
{
	data = JSON.parse(data);
	request({
		uri: data.epitech_url,
		method: 'GET',
	}, function (error, response, body) {
		if (error) {
			res.sendStatus(404);

		} else {
			if (response.request.uri.href == "https://intra.epitech.eu/") {
				user.settings = data;
				user.save(function(err) {
					if (err) throw err;
					res.sendStatus(200);
				})
			} else {
				res.sendStatus(404);
			}
		}
	});
}

var rand = function() {
	return Math.random().toString(36).substr(2); // remove `0.`
};

var token = function() {
	return rand() + rand(); // to make it longer
};