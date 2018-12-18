var charts = require('./chart/charts');

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

	return err;
};

//user session

sessionInit = function(req, res, next) {
  var userConfig = req.session.userConfig;
  if (userConfig === undefined) {
    userConfig = charts.newConfiguration();
  }

	// Make sure the times are the appropriate Date object
  if (typeof userConfig.starttime == 'string' || userConfig.starttime instanceof String)
    userConfig.starttime = new Date(userConfig.starttime);
  if (typeof userConfig.endtime == 'string' || userConfig.endtime instanceof String)
    userConfig.endtime = new Date(userConfig.endtime);
	if (userConfig.starttime.toString() === "Invalid Date") {
		console.log("Invalid Date for starttime");
	}
	if (userConfig.endtime.toString() === "Invalid Date") {
		console.log("Invalid Date for endtime");
	}
  req.session.userConfig = userConfig;
	next();
}

module.exports = function(app, passport) {

	//debug
	app.get('*', function(req, res, next) {
		next();
	});

	app.get('*', sessionInit); 
	app.post('*', sessionInit); 

	app.get('/graphics/:patient', charts.summary);
	app.get('/charts/:patient', charts.summary);

	// AJAX
	// Update the chart according to the data that was received
	app.post('/api/ajax/updateCharts', function(req, res, next) {
		charts.queryDataUpdate(req.session.userConfig, req.query);
		charts.processData(req.session, function(err, chartData) {
			if (err) {
				res.send(err);
			} else {
				var formattedData = charts.formatForGoogleCharts(chartData, req.session.userConfig);

				res.send({chartData: formattedData, chartConfig: req.session.userConfig});
			}
		});
	});
};
