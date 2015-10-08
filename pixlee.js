//Collections
Posts = new Mongo.Collection("posts");

//Router
Router.configure({
    layoutTemplate: 'main'

});


Router.route('/', {
    name: 'home',
    action: function() {
        this.render('home');
    }
});


Router.route('/_oauth/instagram', {
    name: 'insta',
    template: 'insta',
    action: function() {
        this.render('insta');
    }
});
/* TODO: login
Router.route('/login', {
  layoutTemplate: 'login' //so the layout excludes the form
  }
);
*/
//Hooks
Router.onBeforeAction(function() {
    /*TODO: login
    if(!Session.get('isUserLoggedIn')){
      this.render('login');
    }else{
      //continue to rendering other templates
      this.next();
    }
    */
});



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
            var formText = event.target.hashtagField.value;
            console.log('Form text: ' + formText);
            var startDate = event.target.start.value;
            console.log('Start date: ' + startDate);
            var endDate = event.target.end.value;
            console.log('End date: ' + endDate);
            Meteor.call('clearAllDocsInDB');
            Meteor.call('httpGetInstagram', formText);
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
    httpGetInstagram: function(hashtag) {
        /*TODO: make access token private*/
        var instagramAPIUrl = "https://api.instagram.com/v1/tags/" + hashtag + "/media/recent?access_token=267464263.362593b.a1f18dbefa4443509da2049f12543be9";
        HTTP.get(instagramAPIUrl, { /*options*/ },
            function(err, response) {
                if (!err) {
                    var json = response['data']['data']; //Instagram data array is found in the 'data' key within the 'data' key of the response
                    Meteor.call('insertPostsIntoDB', json)
                } else {
                    console.log(err);
                }
            });

    },
    insertPostsIntoDB: function(json) {
        for (var post in json) { //iterate through json obj using keys
            if (json.hasOwnProperty(post)) { //check if json obj actually has property 
                
                Posts.insert(json[post]);
            
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
      }
});
