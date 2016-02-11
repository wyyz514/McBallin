var mongoose = require("mongoose");
var mongo_url = "mongodb://wasp:sting@ds037205.mongolab.com:37205/rando";
var db = "";
//connect to mongolab
db = mongoose.connection;

db.once("open",function(err){
  if(err) {
    return new Error("Unable to connect");
  }
  else {
    console.log("Connection established.");
  }
});

module.exports = function(){
  mongoose.connect(mongo_url);
};
