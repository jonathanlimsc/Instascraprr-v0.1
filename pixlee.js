
//Client
if (Meteor.isClient) {
    
    $(window).scroll(function() {
    if($(window).scrollTop() + $(window).height() == $(document).height()) {
            console.log('bottom reached');
            //Meteor.call('httpGetInstagram');
        $('#jgallery').justifiedGallery('norewind');
      }
    });
    //Datepicker
    Template.datepicker.rendered = function() {
        $('.input-daterange').datepicker({
            orientation: "top auto"
        });

    }
    //Justified gallery
    Template.image.rendered = function(){
          $('#jgallery').justifiedGallery({
            rowHeight: 240,
            lastRow: 'justify',
            margins: 0,
            captions: true,
            imagesAnimationDuration: 200,
            captionSettings: {animationDuration: 200, 
                            visibleOpacity: 0.7,
                            nonVisibleOpacity: 0.0}
          });
          //TODO: infinite scrolling not working and Load more causes page
          //to jump up to the top of the screen
    }

    //Helpers and events
    Template.form.events({
        'submit .search-form': function(event) {
            event.preventDefault();
            //Processing hashtag and dates
            var hashTag = event.target.hashtagField.value;
            console.log('Form text: ' + hashTag);
            var startDate = event.target.start.value;
            if(startDate === ""){
              startDate = moment().format("MM/DD/YYYY");
            }
            startDate = startDate + " 00:00:00";
            var startUnix = moment(startDate, "MM-DD-YYYY HH:mm:ss").unix();

            console.log('Start date: ' + startDate + " " + startUnix);
            /*FOR DATE RANGE FUNCTIONALITY
            var endDate = event.target.end.value; + " 23:59:59";
            if(endDate === ""){
              endDate = moment().format("MM/DD/YYYY");
            }
            endDate = endDate + " 23:59:59";
            var endUnix = moment(endDate, "MM-DD-YYYY HH:mm:ss").unix();
            console.log('End date: ' + endDate + " " + endUnix);
            var timeRange = {
              'startUnix' : startUnix,
              'endUnix' : endUnix
            };
            console.log(timeRange);*/
            Meteor.call('resetBackEnd');
            Meteor.call('retrievePostsFromInstagramController', hashTag, startUnix);


        }

    });

    Template.justifiedGallery.helpers({
        posts: function() {
            var found = Posts.find({
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
            return found;
          }
    });

    Template.gallery.helpers({
      count: function(){
          return Posts.find().count();
        }
    });

    Template.loader.events({
      'click .loader-button': function(event){
        Meteor.call('httpGetInstagram');
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
   // Meteor.startup(function() {
        // code to run on server at startup

        //TODO: Add CORS authorisation to app
       /* WebApp.connectHandlers.use(function(req, res, next) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            return next();
        });*/
    //});
    var nextUrl;
    var earliestCreatedTime;
    var startDate;

    Meteor.methods({
    retrievePostsFromInstagramController: function(hashtag, startUnix){
     var apiUrl = "" + globalApiUrlStart + hashtag + globalApiUrlEnd;
        startDate = startUnix;
        console.log("startDate in retrievePostsFromInstagramController: " + startDate);
        console.log("earliestCreatedTime in retrievePostsFromInstagramController: " + earliestCreatedTime);
        console.log("nextUrl in retrievePostsFromInstagramController: " + nextUrl);
        if(!nextUrl){ //nextUrl is null for first iteration
            nextUrl=apiUrl;
        }
        console.log("nextUrl in retrievePostsFromInstagramController: " + nextUrl);

        //Paginate if created_time is still after the start time (next url)
        //earliestCreatedTime will be null on the first iteration
            if(!earliestCreatedTime || startUnix<=earliestCreatedTime){
                Meteor.call('httpGetInstagram');
            }
    },

    httpGetInstagram: function() {
        if(!nextUrl){
          return;
        }     
        HTTP.get(nextUrl, { /*options*/ },
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
      //Retrieve timeRange object from collection
      console.log('startDate in insertPostsIntoDB :' + startDate);
        var jsonSize = Object.keys(json).length;
        console.log("Json size: " + jsonSize);

        for (var index in json) { //iterate through json obj using keys. Json contains keys (index) whose value is the insta post obj
            var createdTimeOfPost = json[index]['created_time'];
            if (json.hasOwnProperty(index)) { //check if json obj actually has that key
                  if(index==jsonSize-1){
                  earliestCreatedTime = createdTimeOfPost; //update earliestCreatedTime
                  console.log("earliestCreatedTime in insertPostsIntoDB: " + earliestCreatedTime);
            }
            if(createdTimeOfPost>=startDate){
                  Posts.insert(json[index]);
            } 
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
      id = 0;
      nextUrl = null;
      earliestCreatedTime;
      startDate = null;
      Meteor.call('clearAllDocsInDB');
    }
    
  });

      
}

