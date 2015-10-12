
//Client
  
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

