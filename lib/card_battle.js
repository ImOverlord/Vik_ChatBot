let facebook = require("./facebook");
let msg = require("./message_analyser");
let User = require("../models/user");
let mongoose = require("mongoose");
let request = require("request");

function init()
{
	facebook = require("./facebook");
	msg = require("./message_analyser");
	User = require("../models/user");
	mongoose = require("mongoose");
	request = require("request");
}

function card_main(senderID, messageText)
{
	if (msg.contains(messageText, "score")) {
		send_score(senderID);
	} else {
		init_game(senderID);
	}
}

function send_score(senderID)
{
	User.findOne({user_id: senderID}, function (err, user) {
		var string = "Your current score is " + user.card.score;
		facebook.sendTextMessage(senderID, string);
	});
}

function init_game(senderID)
{
	User.findOne({user_id: senderID}, function(err, user) {
		if (user.card.deck_url == undefined || user.card.deck_url.length == 0) {
			card_generate_deck(senderID, user);
		} else {
			card_validate_deck(senderID, user);
		}
	})
}

function card_validate_deck(senderID, user)
{
	request({
		uri: 'https://deckofcardsapi.com/api/deck/' + user.card.deck_url,
		method: 'GET',
	}, function (error, response, body) {
		body = JSON.parse(body);
		if (body.remaining == 0 || body.remaining == 1) {
			data.deck_id = "";
			data = JSON.stringify(data);
			user.card.deck_url = "";
			user.save(function(err) {
				if (err) throw err;
				init_game(senderID);
			})
			
		} else {
			play_game(user);
		}
	});
}

function card_generate_deck(senderID, user)
{
	request({
		uri: 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1',
		method: 'GET',
	}, function (error, response, body) {
		body = JSON.parse(body);
		user.card.deck_url = body.deck_id;
		user.save(function(err) {
			if (err) throw err;
			init_game(senderID);
		})
	});
}

function human_readable_to_bot(string)
{
	if (string == "KING") {
		return (13);
	}
	if (string == "QUEEN") {
		return (12);
	}
	if (string == "JACK") {
		return (11);
	}
	if (string == "ACE") {
		return (14);
	}
	return (parseInt(string));
}

function play_game(user)
{
	request({
		uri: 'https://deckofcardsapi.com/api/deck/' + user.card.deck_url + '/draw/?count=2',
		method: 'GET',
	}, function (error, response, body) {
		body = JSON.parse(body);
		var user_card = body.cards[0].value;
		var user_card_v = human_readable_to_bot(user_card);
		var user_card_suit = body.cards[0].suit;
		var vik_card = body.cards[1].value;
		var vik_card_v = human_readable_to_bot(vik_card);
		var vik_card_suit = body.cards[1].suit;
		var string = "You got a " + user_card + " of " + user_card_suit + ", Vik got a " + vik_card + " of " + vik_card_suit + ". ";
		if (user_card_v > vik_card_v) {
			string += "You Won :)";
			user.card.score += 1;
			user.save(function(err) {
				if (err) throw err;
			})
		}
		if (user_card_v == vik_card_v) {
			string += "It's a Tie :/";
		}
		if (user_card_v < vik_card_v) {
			string += "You Lost :(";
		}
		facebook.sendTextMessage(user.user_id, string);
	});
}

module.exports = {
	init_game,
	card_main,
	init
}