  //Server
  
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
