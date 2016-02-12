var express = require("express"),
  google = require("googleapis"),
  googleAuth = require('google-auth-library'),
  credentials = require("./config.js");

var app = express(),
  db = require("./app/db.js"),
  calendar = google.calendar('v3'),
  date = require('datejs'),
  auth = new googleAuth(),
  oAuthClient = new auth.OAuth2(credentials.client_id, credentials.client_secret, credentials.redirect_url),
  tokenUtils = require('./app/auth.js')(oAuthClient),
  Token = require("./app/token.js"),
  port = 3000 | process.env.PORT;

function list_events(auth) {
  calendar.events.list({
  auth: auth,
  calendarId: 'athleticsmcgill@gmail.com',
  maxResults: 10,
  singleEvents: true,
  orderBy: 'startTime',
  timeMin:new Date().toISOString()
}, function(err, response) {
  if (err) {
    console.log('The API returned an error: ' + err);
    return;
  }
  var events = response.items;
  if (events.length == 0) {
    console.log('No upcoming events found.');
  } else {
    console.log('Upcoming 10 events:');
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var start = event.start.dateTime || event.start.date;
      console.log('%s - %s', Date.parse(start).toDateString(), event.summary);
    }
  }
});
}

app.get('/', function(req, res) {
    Token.findOne({},function(err,tokens){
      if (tokens) {
        // If going through here always refresh
        tokenUtils.refreshToken(tokens.refresh_token);
        res.send('authenticated');
        list_events(oAuthClient);
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

// make sure user is authenticated but check for existing tokens first
 Token.findOne({},function(err,token) {
   if(token)
    tokenUtils.authenticateWithDB();
 });

app.listen(port,function(){
  console.log("Listening on port "+port);
  db();
});
