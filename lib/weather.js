let facebook = require("./facebook");
let User = require("../models/user");
let mongoose = require("mongoose");
let request = require("request");
let msg = require("./message_analyser");
let py = require("python-shell");
let fs = require("fs");
let config = require("config");

//Categories
// Needs to be chnaged to work with AI
var today = ["today", "today's"];
var now = ["now", "current", "present"];
var day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function init()
{
	facebook = require("./facebook");
	User = require("../models/user");
	mongoose = require("mongoose");
	request = require("request");
	msg = require("./message_analyser");
	py = require("python-shell");
	fs = require("fs");
	config = require("config");
	WUNDERGUARD = (process.env.WUNDERGUARD) ? 
	process.env.WUNDERGUARD :
	config.get('wunderguard');

	OPENWEATHER = (process.env.OPENWEATHER) ? 
	process.env.OPENWEATHER :
	config.get('openweathermap');

	if (!(WUNDERGUARD && OPENWEATHER)) {
		console.error("Missing Weather config values");
		process.exit(1);
	}
}

function get_current_weather(senderID)
{
	User.findOne({user_id: senderID}, function(err, user) {
		if(user.location == "{}") {
			facebook.sendTextMessage(senderID, "Sorry, I don't have your location <3");
			return;
		} else {
			request({
				uri: 'http://api.openweathermap.org/data/2.5/weather?lat=' + user.location.lat + "&lon=" + user.location.lng + "&mode=json&appid=" + OPENWEATHER,
				method: 'GET',
			}, function (error, response, body) {
				body = JSON.parse(body);
				var temp = roundUp(parseInt(body.main.temp) - 273.15, 10);
				var condition = body.weather[0].main;
				var obj = {};
				obj.time = body.dt;
				obj.temp = temp;
				obj.desc = condition;
				obj.img = "http://openweathermap.org/img/w/" + body.weather[0].icon + ".png";
				day_n(senderID, JSON.stringify(obj));
			});
		}
	});
}

function get_today_weather(senderID)
{
	User.findOne({user_id: senderID}, function (err, user) {
		if (user.weather.today.length == 0 || user.weather.length == undefined) {
			facebook.sendTextMessage(senderID, "Hmm Sorry, seems we dont have today's weather recap");
		}
		var today = user.weather.today;
		var string = JSON.stringify(today);
		temp_f = "./tmp/" + token();
		fs.writeFile(temp_f, string, function(err) { 
			if (err) throw err; 
			py.run( './python/martient_weather_7.py', {args: [senderID, temp_f]}, function(err, result) { 
				if (err) throw err; 
				facebook.sendImageMessage(senderID, "/" + senderID + "_weather_one.png");
				fs.unlinkSync(temp_f);
			})
		})
	})
}

function get_n_day_py(senderID, string)
{ 
	//string = string.replace(/\"/g, "\\\""); 
	//string = "\"" + string + "\"" 
	temp_f = "./tmp/" + token();
	fs.writeFile(temp_f, string, function(err) { 
		if (err) throw err; 
		py.run( './python/martient_weather_pred.py', {args: [senderID, temp_f]}, function(err, result) { 
			if (err) throw err; 
			facebook.sendImageMessage(senderID, "/" + senderID + "_weather_one.png");
			fs.unlinkSync(temp_f);
		})
	})
} 

function day_n(senderID, string)
{ 
	//string = string.replace(/\"/g, "\\\""); 
	//string = "\"" + string + "\"" 
	temp_f = "./tmp/" + token();
	fs.writeFile(temp_f, string, function(err) { 
		if (err) throw err; 
		py.run( './python/martient_weather_now.py', {args: [senderID, temp_f]}, function(err, result) { 
			if (err) throw err; 
			facebook.sendImageMessage(senderID, "/" + senderID + "_weather_one.png");
			fs.unlinkSync(temp_f);
		})
	})
} 
function get_n_day(senderID, day)
{
	User.findOne({user_id: senderID}, function (err, user) { 
		var i = 0;
		if (user.weather.prediction.weather.length == 0) {
			update_10_weather(senderID, day);
		} else {
			while (i < user.weather.prediction.weather.length) { 
				if (day == user.weather.prediction.weather[i].w_day) { 
					get_n_day_py(senderID, JSON.stringify(user.weather.prediction.weather[i])); 
					break; 
				} 
			i++; 
			}
		}
	});
}

function main_weather(senderID, messageText)
{
	User.findOne({user_id: senderID}, function(err, user) {
		console.log(user.location);
		if (user.location != undefined) {
			if (user.location.lat == 0) { 
				facebook.sendTextMessage(senderID, "Sorry to access our weather service you need to share your location with us."); 
			} else {
				console.log(user.location.length);
				if (messageText.length == 1) 
					get_current_weather(senderID);
				if (msg.contains(messageText, "tomorrow"))
					get_n_day(senderID, get_tomorrow());
				if (msg.category_match(messageText, now)) 
					get_current_weather(senderID); 
				if (msg.category_match(messageText, today)) 
					get_today_weather(senderID); 
				if (msg.category_match(messageText, day)) 
					get_n_day(senderID, msg.category_match_plus(messageText, day)); 
			}
		}
	})
}

function get_tomorrow()
{
	console.log("Called");
	var d = new Date();
	var d = d.getDay() + 1
	if (d > 6)
		d = 0;
	return (day[d]);
}

function roundUp(num, precision) {
	return (Math.ceil(num * precision) / precision)
}

function add_location(senderID, event)
{
	var location = event.payload;
	User.findOne({user_id: senderID}, function(err, user) {
		if (user == null) {
			console.log("User doesnt exist");
			facebook.sendTextMessage(senderID, "You must send a message before sending your location");
		} else {
			user.location.lat = roundUp(location.coordinates.lat, 10);
			user.location.lng = roundUp(location.coordinates.long, 10);
			user.save(function(err) {
				if (err) throw err;
				facebook.sendTextMessage(senderID, "You location has been added.");
				set_time(user);
			})
		}
	})
}

function set_time(user)
{
	request({
		uri: "http://api.wunderground.com/api/" + WUNDERGUARD + "/geolookup/q/" + user.location.lat + "," + user.location.lng + ".json",
		method: 'GET',
	}, function (error, response, body) {
		body = JSON.parse(body);
		var timezone_string = body.location.tz_long;
		request({
			uri: "https://timezoneapi.io/api/timezone/?" + timezone_string,
			method: 'GET',
		}, function (error, response, body) {
			body = JSON.parse(body);
			user.location.timezone = body.data.datetime.offset_hours;
			user.save(function(err) {
				if (err) throw err;
			});
		});
	});
}

function convertEpochToSpecificTimezone(epoch, offset){
	var d = new Date(epoch);
	var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
	var nd = new Date(utc + (3600000*offset));
	return nd.toLocaleString();
}

function update_today_weather(senderID)
{
	User.findOne({user_id: senderID}, function (err, user) {
		request({
			uri: 'http://api.openweathermap.org/data/2.5/forecast?lat=' + user.location.lat + "&lon=" + user.location.lng + "&mode=json&appid=" + OPENWEATHER,
			method: 'GET',
		}, function (error, response, body) {
			body = JSON.parse(body);
			var data = body.list;
			var i = 0;
			var new_obj = [];
			user.weather.today.weather = new_obj; 
			while (i < 8) {
				var w_obj= {};
				var time = data[i].dt;
				w_obj.time = data[i].dt;
				w_obj.time_str = convertEpochToSpecificTimezone(time*1000, parseInt(user.location.timezone));
				w_obj.temp = roundUp(data[i].main.temp - 273.15, 10);
				w_obj.desc = data[i].weather[0].description;
				w_obj.img = "http://openweathermap.org/img/w/" + data[i].weather[0].icon + ".png";
				i++;
				new_obj.push(w_obj);
			}
			user.weather.today.weather = new_obj;
			user.save(function (err) {
				if (err) throw err;
			})
		});
	})
}

function update_10_weather(senderID, day)
{
	User.findOne({user_id: senderID}, function (err, user) {
		console.log(user.location);
		if (user.location == {}) {
			console.log("Error");
			return;
		} else {
			request({
				uri: "http://api.wunderground.com/api/" + WUNDERGUARD + "/forecast10day/q/" + user.location.lat + "," + user.location.lng + ".json",
				method: 'GET',
			}, function (error, response, body) {
				body = JSON.parse(body);
				console.log(body);
				var data = body.forecast.simpleforecast.forecastday;
				var i = 0;
				var new_obj = [];
				while (i < data.length) {
					var w_obj= {};
					w_obj.time = parseInt(data[i].date.epoch);
					w_obj.time_str = convertEpochToSpecificTimezone(w_obj.time * 1000, user.location.timezone);
					w_obj.w_day = data[i].date.weekday.toLowerCase();
					w_obj.h_temp = parseInt(data[i].high.celsius);
					w_obj.l_temp = parseInt(data[i].low.celsius);
					w_obj.img = data[i].icon_url;
					w_obj.desc = data[i].conditions;
					new_obj.push(w_obj);
					i++;
				}
				user.weather.prediction.weather = new_obj;
				user.save(function (err) {
					if (err) throw err;
					get_n_day(senderID, day);
				})
			});
		}
	})
}

var rand = function() { 
	return Math.random().toString(36).substr(2); // remove `0.` 
};

var token = function() { 
	return rand() + rand(); // to make it longer 
}; 

module.exports = {
	init,
	add_location,
	main_weather,
	update_today_weather,
	update_10_weather,
	get_today_weather
}