var express = require("express"),
  google = require("googleapis"),
  googleAuth = require('google-auth-library'),
  credentials = require("./config.js");

var app = express(),
  db = require("./app/db.js"),
  calendar = google.calendar('v3'),
  auth = new googleAuth(),
  oAuthClient = new auth.OAuth2(credentials.client_id, credentials.client_secret, credentials.redirect_url),
  tokenUtils = require('./app/auth.js')(oAuthClient),
  Token = require("./app/token.js"),
  port = 3000 | process.env.PORT;

app.get('/', function(req, res) {
    Token.findOne({},function(err,tokens){
      if (tokens) {
        // If going through here always refresh
        tokenUtils.refreshToken(tokens.refresh_token);
        res.send('authenticated');
      } else {
        tokenUtils.requestToken(res);
      }
    });
});

// Return point for oAuth flow
app.get('/auth', function(req, res) {

  var code = req.query.code;

  if (code) {
    tokenUtils.authenticateWithCode(code, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/');
      }
    });
  }
});

app.listen(port,function(){
  console.log("Listening on port "+port);
  db();
});
