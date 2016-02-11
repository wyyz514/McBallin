var mongoose = require("mongoose");
var tokenSchema = mongoose.Schema({access_token:String,expires_at:Date,refresh_token:String});

var Token = mongoose.model("Token",tokenSchema,"tokens");
module.exports = Token;
