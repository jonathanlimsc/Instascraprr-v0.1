
//Client
if (Meteor.isClient) {

    //Datepicker
    Template.datepicker.rendered = function() {
        $('.input-daterange').datepicker({
            orientation: "top auto",
        });

    }
     Template.gallery.rendered = function(){
      $('#styled-gallery').justifiedGallery(this.data.options); //passed in from main template
      /*$('#styled-gallery').on('jg.complete', function(){//render color box
          $('#styled-gallery a').swipebox();
      });
      */
    };


    //Helpers and events
    Template.main.helpers({
      galleryOptions : function(){
        return { rowHeight: 240};
      }
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
            Meteor.call('resetBackEnd');
            Meteor.call('retrievePostsFromInstagramController', hashTag, timeRange);

        }

    });

    Template.gallery.helpers({
        posts: function() {
          $('#gallery').justifiedGallery({rowHeight: 120 });

            return Posts.find({
                  type: 'image'
              }, //criteria
              {
                  fields: {
                      'user.username' : 1,
                      'images.standard_resolution.url': 1,
                      'caption.text':1,
                      'link':1 //insta link
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

        //TODO: Add CORS authorisation to app
       /* WebApp.connectHandlers.use(function(req, res, next) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            return next();
        });*/
    });
    var nextUrl;
    var earliestCreatedTime;
    var timeRange;

    Meteor.methods({
    retrievePostsFromInstagramController: function(hashtag, range){
     var apiUrl = "" + globalApiUrlStart + hashtag + globalApiUrlEnd;
        timeRange = range;
        console.log("timeRange in retrievePostsFromInstagramController: " + timeRange);
        var startUnix = timeRange['startUnix'];
        console.log("StartUnix in retrievePostsFromInstagramController: " + startUnix);
        console.log("earliestCreatedTime in retrievePostsFromInstagramController: " + earliestCreatedTime);
        console.log("nextUrl in retrievePostsFromInstagramController: " + nextUrl);
        if(!nextUrl){ //nextUrl is null for first iteration
            nextUrl=apiUrl;
        }
        var count = 0;
        //Paginate if created_time is still after the start time (next url)
          do{
          console.log("nextUrl in retrievePostsFromInstagramController: " + nextUrl);
          Meteor.call('httpGetInstagram', nextUrl);
                  count++;
          }while(startUnix<=earliestCreatedTime && count<1); //limiting the number of calls to prevent instagram lockout
    },

    httpGetInstagram: function(url) {
        /*TODO: make access token private*/
        
        HTTP.get(url, { /*options*/ },
            function(err, response) {
                if (!err) {
                    //Instagram posts array is found in the 'data' key within the 'data' key of the response
                    var json = response['data']['data'];
                    nextUrl = response['data']['pagination']['next_url']; 
                    console.log("NextUrl updated in httpGetInstagram: " + nextUrl);
                    Meteor.call('insertPostsIntoDB', json)
                } else {
                    console.log(err);
                }
            });

    },
    insertPostsIntoDB: function(json) {
      //Retrieve timeRange object from collections
        console.log(timeRange);
        var startUnix = timeRange['startUnix'];
        var endUnix = timeRange['endUnix'];
        var jsonSize = Object.keys(json).length;
        console.log("Json size: " + jsonSize);

        for (var index in json) { //iterate through json obj using keys. Json contains keys (index) whose value is the insta post obj
            if (json.hasOwnProperty(index)) { //check if json obj actually has that key
                  if(index==jsonSize-1){
                  earliestCreatedTime = json[index]['created_time']; //update earliestCreatedTime
                  console.log("earliestCreatedTime in insertPostsIntoDB: " + earliestCreatedTime);
            }
            //if(earliestCreatedTime>=startUnix && earliestCreatedTime<=endUnix){
                  Posts.insert(json[index]);
            //} 
          }
       }
        var found = Posts.find({
            type: "image"
        }).fetch();
        console.log("Found number of posts in insertPostsIntoDB: " + found.length);
    },
    clearAllDocsInDB: function() {
        Posts.remove({}); //Remove all documents in collection
    },
    resetBackEnd: function(){
      nextUrl = null;
      earliestCreatedTime = moment.unix();
      timeRange = null;
      Meteor.call('clearAllDocsInDB');
    }
    
  });

      
}

