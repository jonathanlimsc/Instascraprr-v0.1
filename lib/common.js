//Common
globalApiUrlStart = "https://api.instagram.com/v1/tags/";
globalApiUrlEnd = "/media/recent?access_token=267464263.1677ed0.7220a29ce9c9417fb1f4e3e63b112ba3";

//Collections
Posts = new Mongo.Collection("posts");

//Router

/* TODO: login
Router.route('/login', {
  layoutTemplate: 'login' //so the layout excludes the form
  }
);
*/
//Hooks
/*
Router.onBeforeAction(function() {
    TODO: login
    if(!Session.get('isUserLoggedIn')){
      this.render('login');
    }else{
      //continue to rendering other templates
      this.next();
    }
});*/