let User = require("../models/user");
let mongoose = require("mongoose");
let request = require("request");
let facebook = require("./facebook");
let card = require("./card_battle");
let weather = require("./weather");

function init()
{
	User = require("../models/user");
	mongoose = require("mongoose");
	request = require("request");
	facebook = require("./facebook");
	card = require("./card_battle");
	weather = require("./weather");
}

