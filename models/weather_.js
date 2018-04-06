var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	timezone: {type: Number, unique: true},
	

});
var User = mongoose.model('User', userSchema);
module.exports = User;