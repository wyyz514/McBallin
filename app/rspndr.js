var credentials = require("../config.js");
var twilio_client = require("twilio")("AC755b9598bef33a5a28eb89e0badbe8bd","d4361a634712a8e678f49b75d35c6f71");

module.exports = function(rsp) {
  console.log("RecBall: ",rsp.response);

  twilio_client.messages.create({
      body: rsp.response,
      to: rsp.to,
      from: rsp.from
  }, function(err, message) {
      if(err)
        console.log("\nError: ",err.message);
      else
        process.stdout.write(message.sid);
  });
}
