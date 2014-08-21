/*jshint node:true*/

// app.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/),
// and jade as template engine (http://jade-lang.com/).

var express = require('express');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
		cloudant = require('./app/database/cloudant');
var passport = require('passport');
		require('./app/passport/passport')(passport);

var flash 	 = require('connect-flash');

// setup middleware
var app = express();

app.use(express.cookieParser());
app.use(express.session({secret: (process.env.SESSION_SECRET || 'My password is qwert1234')}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser());
app.use(app.router);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(express.errorHandler());
app.use(express.static(__dirname + '/public')); //setup static public directory
app.set('view engine', 'jade');
app.set('views', __dirname + '/views'); //optional since express defaults to CWD/views
app.use(flash()); // use connect-flash for flash messages stored in session


// There are many useful environment variables available in process.env,
// please refer to the following document for detailed description:
// http://ng.w3.bluemix.net/docs/FAQ.jsp#env_var

// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);

    debug = (process.env.DEBUG || undefined);


require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// Start server
app.listen(port, host);
cloudant.connect();
console.log('App started on', host + ':' + port);
