/*jshint node:true*/

// app.js
// This file sets the main configurations of the application

var express = require('express');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Cloudant Database configuration
		cloudant = require('./app/database/cloudant');

// setup middleware
var app = express();

app.use(express.cookieParser());
app.use(express.session({secret: (process.env.SESSION_SECRET || 'My password is qwert1234')}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(app.router);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(express.errorHandler());
app.use(express.static(__dirname + '/public')); //setup static public directory
app.set('view engine', 'jade');
app.set('views', __dirname + '/views'); //optional since express defaults to CWD/views

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

require('./app/routes.js')(app); // load our routes and pass in our app

// Start server
app.listen(port, host);

//connect to cloudant database
cloudant.connect();
console.log('App started on', host + ':' + port);
