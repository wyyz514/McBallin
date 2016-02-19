//Adapted from https://github.com/mplacona/twilio-pa
var express = require("express"),
  google = require("googleapis"),
  googleAuth = require('google-auth-library'),
  credentials = require("./config.js"),
  body_parser = require("body-parser");
  q = require("q");

var app = express(),
  DBConnect = require("./app/db.js"),
  calendar = google.calendar('v3'),
  date = require('datejs'),
  auth = new googleAuth(),
  oAuthClient = new auth.OAuth2(credentials.client_id, credentials.client_secret, credentials.redirect_url),
  tokenUtils = require('./app/auth.js')(oAuthClient),
  Token = require("./app/token.js"),
  rspndr = require("./app/rspndr.js");
  port = process.env.PORT;

app.use(body_parser.urlencoded());
app.use(body_parser.json());

function refresh_token(req,res,next) {

    Token.findOne({},function(err,tokens){
      if (tokens) {
        // If going through here always refresh
        tokenUtils.refreshToken(tokens.refresh_token);
        //res.send('authenticated');
      } else {
        tokenUtils.requestToken(res);
      }
    });
    next();
}

function get_event(auth) {
  var defer = q.defer();
  var rec_ball_event = "";
  var today = new Date().toISOString();
  calendar.events.list({
  auth: auth,
  calendarId: 'athleticsmcgill@gmail.com',
  maxResults: 10,
  singleEvents: true,
  orderBy: 'startTime',
  timeMin:today
}, function(err, response) {
  if (err) {
    console.log('The API returned an error: ' + err);
    return;
  }
  var events = response.items;
  if (events.length == 0) {
    console.log('No upcoming events found.');
  } else {
    //console.log('Upcoming 10 events:');
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var start = event.start.dateTime || event.start.date;
      if(event.summary.toLowerCase().match("rec basketball")) {
        rec_ball_event = new Date(Date.parse(start)).addHours(-5).toLocaleString()+" - "+event.summary;
        break;
      }
        //console.log('%s - %s', Date.parse(start).toLocaleString(), event.summary);
    }
  }
  if(rec_ball_event != "") {
    defer.resolve(rec_ball_event);
  }
  else {
    defer.resolve("No rec-ball event today.");
  }
});

  return defer.promise;
}

app.get('/', refresh_token);

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
  DBConnect();
});

app.post("/incoming",
    refresh_token,
    function(req,res) {
      var resp_info = {};
      resp_info.from = req.body.To;
      resp_info.to = req.body.From;
      resp_info.body = req.body.Body;
      get_event(oAuthClient).then(function(event){
        resp_info.response = event;
        rspndr(resp_info);
      });
});
