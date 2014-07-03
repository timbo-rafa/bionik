/*jshint node:true*/

// app.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/),
// and jade as template engine (http://jade-lang.com/).

var express = require('express');
    cloudant = require('./routes/database/cloudant');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var charts = require('./routes/chart/charts');

// setup middleware
var app = express();

app.use(cookieParser());
app.use(bodyParser());
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

// Start server
app.listen(port, host);
cloudant.connect();
console.log('App started on port ' + port);

// error/info messages
msg = '';
DATE_SEPARATOR = '/';

// function that generates error messages appropriately to be displayed on the browser.
// related to the database.
function errorMessage(err) {
	console.log(err);
	if (err.error == 'not_found') {
		if ( err.reason == 'missing') {
			return 'Database not found.';
		} else return err.reason;
	}

	// as a last resort, return the error itself.
	return err;
}

// Routing

//debug
app.get('*', function(req, res, next) {
	//console.log(req.method, req.url, req.statusCode, req.httpVersion);
	next();
});

// first page

app.get('/', function(req, res){
	res.render('index');
});

app.get('/graphics', charts.example);
app.get('/graphics/:patient', charts.summary);
app.get('/charts', charts.example);
app.get('/charts/:patient', charts.summary);

// query data from the cloud
app.get('/cloudant/query', function(req, res){
	res.render('cloudant/query');
});

// post data to the cloudant db
app.get('/cloudant/simulatedata', function(req, res) {
	res.render('cloudant/simulatedata', {
		now: new Date().toISOString()
	});
});

//retrieve data from form and redirect to appropriate page cloudant/:patient/:doc
app.post('/cloudant/retrievepatient', function(req, res) {
	res.redirect('/cloudant/' + req.body.querypatient + '/' + req.body.doctimestamp);
});

//post the data from simulatedata and then render the display page(
app.post('/cloudant/postsimulateddata', function(req, postres) {
	console.log(req.body);
	var patientname = req.body.patientname;
	var dbname = patientname;

	//id of doc will be timestamp. Problematic if the mcu produced two sets of data with the same
	//timestamp. Is that a problem??
	console.log('time from HTML form');
	req.body.TS = new Date(req.body.time).toISOString();
	console.log(req.body.TS.toString());
	req.body.time = new Date(req.body.TS).getTime();
	console.log(req.body.time);
	req.body.LS = parseInt(req.body.LS,10);
	req.body.RS = parseInt(req.body.RS,10);
	req.body.SS = parseInt(req.body.SS,10);
	req.body.SU = parseInt(req.body.SU,10);
	req.body.SD = parseInt(req.body.SD,10);
	req.body.TN = parseInt(req.body.TN,10);

	var docid = req.body.TS;
	
	cloudant.database(dbname);
	var doc;
	console.log('DEBUG');
	console.log(req.body);

	// check if patient database exists. If not, create it
	cloudant.db.exists(function (err, exists) {
		// XXX: Handle db already exists error
		cloudant.db.create(function(err, res) {
			console.log("db.create(): err and res:");
			console.log(err);
			console.log(res);
			//WARN: Existant document with same timestamp will be overwritten
			cloudant.db.save(docid.toString(), {// the id of the document on the pacient's database
					LS: req.body.LS,
					RS: req.body.RS,
					SS: req.body.SS,
					SU: req.body.SU,
					SD: req.body.SD,
					TN: req.body.TN,
					time: req.body.time,
					TS: req.body.TS.toString()
				}, function (err, res) {
					console.log("doc.save:");
					console.log(err);
					console.log(res);
					if (err) {
						msg = errorMessage(err);
					} else {
						msg = 'Document "' + docid +'" saved successfully.';
						doc = res;
					}
					console.log(msg);
					postres.redirect('/cloudant/' + dbname + '/' + docid);
				});
		});
	});
});

//display all data from a patient
app.get('/cloudant/:patient', function(req, res) {
	var patient = req.params.patient;
	var data = [];
	cloudant.database(patient);
	cloudant.db.all( function(err, clouddata) {
		if (err) {
			msg = errorMessage(err);
			res.render('/cloudant/query', {
				msg : msg
			});
			msg = '';
		} else {
			console.log('clouddata.length() = ' + clouddata.length);
			clouddata.forEach(function(element, index, array) {
				cloudant.database(patient);
				cloudant.db.get(element, function(err, doc) {
					//data.push(Object.clone(doc, true));
					data.push(doc);
					console.log(data.length);
				
					//last loop iteration
					//this should be outside of db.get loop, but the data didnt hold the data (?)
					if (data.length == clouddata.length) {
						console.log('rendering. data.length ' + data.length);
						res.render('cloudant/display', {
							msg: msg,
							data: data
						});
						msg = '';
					}
				});
			});
		}
	});
});

//display one set of data from a patient
app.get('/cloudant/:patient/:docid', function(req, res) {
	var patient = req.params.patient;
	var docid = req.params.docid;
	cloudant.database(patient);
	cloudant.db.get(docid, function(err, doc) {
		if (err) {
			msg = errorMessage(err);
			res.render('cloudant/query', {
				msg: msg,
			});
		} else {
			console.log(doc);
			res.render('cloudant/display', {
				msg : msg,
				data : [
					{
						RS : doc.RS,
						LS : doc.LS,
						SS : doc.SS,
						SU : doc.SU,
						SD : doc.SD,
						TN : doc.TN,
						time : doc.time,
						TS : doc.TS
					}
				]
			});
		}
		msg = '';
	});
});
