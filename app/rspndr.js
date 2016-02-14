var credentials = require("../config.js");
var twilio_client = require("twilio")(credentials.twilio_sid,credentials.twilio_auth);
