var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	first_name: String,
	last_name: String,
	user_id: { type: String, required: true, unique: true },
	admin: {type: Boolean, default: false},
	location : {
		lat : String,
		lng : String,
		timezone: Number
	},
	card : {
		deck_url: {type: String, default: ""},
		score: {type: Number, default: 0}
	},
	settings: {
		epitech_url : {type: String},
		wake_up_h: {type: Number, default: 06},
		wake_up_m: {type: Number, default: 00}
	},
	planner: [{
		epoch: Number,
		unique_id: String,
		title: String,
		start: String,
		end: String,
		detail: String,
		location: String,
		event_time: {type: Number, default: 3}
	}],
	weather: {
		today: {
			timezone: Number,
			weather: [{
				time: Number,
				time_str: String,
				temp: Number,
				img: String,
				desc: String
			}]
		},
		prediction: {
			timezone: Number,
			weather: [{
				time: Number,
				time_str: String,
				w_day: String,
				h_temp: Number,
				l_temp: Number,
				img: String,
				desc: String
			}]
		}
	},
	tokens: {
		count: {type: Number, default: 0},
		date: {type: String},
	}
});

var User = mongoose.model('User', userSchema);
module.exports = User;