
//Client
if (Meteor.isClient) {

    Meteor.call('getPostsForGallery', function(err, result){
      Session.set('postsCursor', result);
    });

    //Datepicker
    Template.datepicker.rendered = function() {
        $('.input-daterange').datepicker({
            orientation: "top auto"
        });
    }


    //Helpers and events
    Template.main.helpers({

    });

    Template.form.events({
        'submit .search-form': function(event) {
            event.preventDefault();
            //Processing hashtag and dates
            var hashTag = event.target.hashtagField.value;
            console.log('Form text: ' + hashTag);
            var startDate = event.target.start.value + " 00:00:00";
            var startUnix = moment(startDate, "MM-DD-YYYY HH:mm:ss").unix();
            console.log('Start date: ' + startDate + " " + startUnix);
            var endDate = event.target.end.value + " 23:59:59";
            var endUnix = moment(endDate, "MM-DD-YYYY HH:mm:ss").unix();
            console.log('End date: ' + endDate + " " + endUnix);
            var timeRange = {
              'startUnix' : startUnix,
              'endUnix' : endUnix
            };
            console.log(timeRange);
          
            Meteor.call('clearTimeRangesInDB');
            Meteor.call('addTimeRangeToDB', timeRange);
            Meteor.call('clearAllDocsInDB');
            Meteor.call('retrievePostsFromInstagramController', hashTag);
        }

    });

    Template.gallery.helpers({
        posts: function() {
          return Posts.find({
                type: 'image'
            }, //criteria
            {
                fields: {
                    'images.standard_resolution.url': 1
                }
            });
        },
        count: function(){
          return Posts.find().count();
        }
    });

    /* TODO: login
     Template.login.events({
        "click .login-btn" : function(event){
          Meteor.loginWithInstagram(function (err, res) {
              if (err !== undefined)
                console.log('sucess ' + res)
              else
                console.log('login failed ' + err)
          });
        }
     });

    */
}

//Server
if (Meteor.isServer) {
    Meteor.startup(function() {
        // code to run on server at startup

        //Add CORS authorisation to app
        WebApp.connectHandlers.use(function(req, res, next) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            return next();
        });
    });
      
}

Meteor.methods({
    retrievePostsFromInstagramController: function(hashtag){
     var apiUrl = "" + globalApiUrlStart + hashtag + globalApiUrlEnd;
        //Get time range to find start time
        var timeRange = TimeRanges.findOne();
        console.log("Time range in retrievePostsFromInstagramController: " + timeRange);
        //Get global collection
        var global;
        if(Global.find().count>1){
          console.log("Error in retrievePostsFromInstagramController: Global collection is greater than 1");
        }else{
          global = Global.findOne();
        }
        var startUnix = timeRange['startUnix'];
        console.log("StartUnix in retrievePostsFromInstagramController: " + startUnix);
        var createdTime = global['createdTime'];
        console.log("createdTime in retrievePostsFromInstagramController: " + createdTime);
        var nextUrl = global['nextUrl'];
        console.log(nextUrl);
        if(!nextUrl){
            nextUrl=apiUrl;
        }

        //Paginate if created_time is still after the start time (next url)
        do{
          Meteor.call('httpGetInstagram', apiUrl);
        }while(startUnix<=createdTime);
    },

    httpGetInstagram: function(url) {
        /*TODO: make access token private*/
        
        HTTP.get(url, { /*options*/ },
            function(err, response) {
                if (!err) {
                    //Instagram posts array is found in the 'data' key within the 'data' key of the response
                    var json = response['data']['data'];
                    var nextUrl = response['data']['pagination']['next_url']; 
                    console.log(nextUrl);
                    Meteor.call('updateNextUrlInDB', nextUrl); 
                    Meteor.call('insertPostsIntoDB', json)
           
                } else {
                    console.log(err);
                }
            });

    },
    insertPostsIntoDB: function(json) {
      //Retrieve timeRange object from collections
        var timeRange = TimeRanges.findOne();
        console.log(timeRange);
        var startUnix = timeRange['startUnix'];
        var endUnix = timeRange['endUnix'];
        var jsonSize = Object.keys(json).length;
        console.log("Json size: " + jsonSize);

        for (var index in json) { //iterate through json obj using keys. Json contains keys (index) whose value is the insta post obj
            if (json.hasOwnProperty(index)) { //check if json obj actually has that key
              var createdTime = json[index]['created_time'];

              //Update createdTime in global collection to the createdTime of last post obj in json
              if(index == jsonSize-1){
                var globalObjSize = Global.find().count();
                if(globalObjSize == 1 || globalObjSize == 0){ //Check to see if there is already a global var
                  Global.upsert({}, {$set: {createdTime: json[index]['created_time']}}); //update createdTime
                  console.log("Created-time is updated : ");
                  console.log(Global.find({}).fetch()); 
                }
                else{ //invalid size
                  console.log("Error: Something went wrong. Global collection is larger than 1.");
                }
              }

              if(createdTime>=startUnix && createdTime<=endUnix){
                  Posts.insert(json[index]);
              } 
          }
       }
        var found = Posts.find({
            type: "image"
        }).fetch();
        console.log(found.length);

    },
    clearAllDocsInDB: function() {
        Posts.remove({}); //Remove all documents in collection
    },
    getPostsForGallery: function() {
            return Posts.find({
                type: 'image'
            }, //criteria
            {
                fields: {
                    'images.standard_resolution.url': 1
                }
            });
      },
      addTimeRangeToDB: function(timeRange){
        TimeRanges.insert(timeRange);
      },
      clearTimeRangesInDB: function(){
        TimeRanges.remove({}); //Remove all time ranges in collection
      },
      updateNextUrlInDB: function(url){
        var globalSize = Global.find().count();
        if(globalSize==0 || globalSize==1){
          Global.upsert({}, {$set:{'nextUrl': url}});
        } else{
          console.log("Error in insertNextUrlIntoDB: Something went wrong. Global collection is larger than 1");
        }
      }
});
