//internal functions

var methods = require('./methods');
var configMaster = require('./config');
var url = require('url');

// the full name of the chart data used to display the name of the variables appropriately
FULLNAME = {
	LS: 'Left step(s)',
	RS: 'Right step(s)',
	SS: 'Continuous step(s)',
	SU: 'Sit down(s)',
	SD: 'Stand up(s)',
	TN: 'Trajectory number',
	TS: 'Timestamp'
};

// The object that will contain the information needed to plot the chart
var constructDisplayObject = function(doc, userConfig) {
	var objectDate = new Date(doc.doc.TS);
	displayObject = {
		LS : 0,
		RS : 0,
		SS : 0,
		SU : 0,
		SD : 0,	
		TN: 0,
		ndocs: 0,
		period: configMaster.getPeriod[userConfig.period](objectDate),
		method: userConfig.method,
		TS: objectDate,
		time: objectDate.getTime(),
		newestTS: new Date(0),
		oldestTS: new Date()
	};
	return displayObject;
};

/* function that decides what calculation will be made (with the step variables)
 * and calls the appropriate function using the appropriate configs
 */
var applyMethod = function(displayObject, singledoc, a, userConfig) {

	var ret = undefined;
	displayObject.date = new Date(displayObject.TS);
	singledoc.doc.date = new Date(singledoc.doc.TS);

	//data must be returned sorted in order to make this conditional valid
	if (configMaster.isSameTimePeriod[userConfig.period](displayObject, singledoc)) {
		methods[userConfig.method](displayObject, singledoc, a);
	} else {
		//begin another set of bars on the graphic
		ret = constructDisplayObject(singledoc, userConfig);
		displayObject = ret;
		methods[userConfig.method](ret, singledoc, a);
	}
	
	//timestamp management
	if (displayObject.newestTS.getTime() < singledoc.doc.TS.getTime())
		// singledoc was generated later than displayObject newest doc. Update
		displayObject.newestTS = singledoc.doc.TS;
	if (displayObject.oldestTS.getTime() > singledoc.doc.TS.getTime())
		// singledoc was generated before than displayObject oldest doc. Update
		displayObject.oldestTS = singledoc.doc.TS;
	
	return ret;
};

// Calculate the sum from all the step variables
var process = function(alldocs, userConfig) {
	
	var displayObject = undefined;
	var alldisplayObjects = [];

	console.log('process: ', alldocs.length, userConfig);
	for (var y in alldocs) {

		var singledoc = alldocs[y];

		if (new Date(singledoc.doc.TS).toString() === "Invalid Date") {
			console.log("Cloudant document has an Invalid Date: \"" + singledoc.doc.TS + "\"" );
		}

		// for each action that we want to display, doo
		for (var actionindex in userConfig.showactions) {
			var action = userConfig.showactions[actionindex];
			if (singledoc.doc[action] && singledoc.doc[action] > 0) {
				singledoc.doc.TS = new Date(singledoc.doc.TS);
				userConfig.starttime = new Date(userConfig.starttime);
				userConfig.endtime = new Date(userConfig.endtime);
				var isInPeriod = ( singledoc.doc.TS.getTime() >=
					userConfig.starttime.getTime() &&
					singledoc.doc.TS.getTime() <=
					userConfig.endtime.getTime());
				
				if (isInPeriod) {

					//core function. Apply the appropriate processing
					if (displayObject === undefined)
						displayObject = constructDisplayObject(singledoc, userConfig);
					var ret = applyMethod(displayObject, singledoc, action, userConfig);
					if (ret) {
						alldisplayObjects.push(displayObject);
						displayObject = ret;
					}
				}
			}
		}
		if (displayObject) displayObject.ndocs += 1;
	}
	if (displayObject) {
		var containsData = false;
		for (var actionindex in userConfig.showactions) {
			var action = userConfig.showactions[actionindex];
			if (displayObject[action] && displayObject[action] > 0)
				containsData = true;
		}
		if (containsData) {
			alldisplayObjects.push(displayObject);
		}
	}
	return alldisplayObjects;
};

exports.queryDataUpdate = function(config, query) {
	console.log(query);
	configMaster.updateConfigurationQuery(config, query);
};

exports.example = function(req, res, next) {
	res.render('charts/example');
};

// Function that formats the data according to Google Chart API
exports.formatForGoogleCharts = function(allDisplayObjects, config) {
	var googleChartsFormattedData = [];
	// First array is expected to be the header
	var header = ["Period"];

	// Header
	for (actionidx in config.showactions) {
		//get the actions that we are going to display
		var actionAcronym = config.showactions[actionidx];
		//get its to full name
		header.push(FULLNAME[actionAcronym]);	
	}

	googleChartsFormattedData.push(header);

	// Now for each chart group
	for (idx in allDisplayObjects) {
		var displayObject = allDisplayObjects[idx];
		//Display the period that the data applies to
		var data = [displayObject.period];
		for (actionidx in config.showactions) {
			action = config.showactions[actionidx];
			//and the number of actions/steps taken regarding that chart bar
			data.push(displayObject[action]);
		}
		//push this line into the data needed for the API
		googleChartsFormattedData.push(data);
	}
	
	return googleChartsFormattedData;
};

// Functions that receives the data from cloudant and
// generates objects suitable for plotting the charts
exports.processData = function(session, callback) {

	cloudant.database(session.patient);
	cloudant.db.all({
		include_docs : true,
		ascending: true,
		retries: 3,
		retryTimeout: 20 * 1000
	}, function(err, alldocs) {
		if (err) {
			console.log('Error retrieving Cloudant data:');
			console.log(err);
		} else {
			var chartData = process(alldocs, session.userConfig);
			console.log(chartData.length + ' docs processed.');
		}
		callback(err, chartData);
	});
};

exports.newConfiguration = configMaster.defaultConfiguration;

exports.summary = function(req, res, next) {
	var userConfig = req.session.userConfig;
	req.session.patient = req.params.patient;
	req.session.userConfig.patient = req.params.patient;
	console.log('patient:', req.params.patient);
	res.render('charts/display', {
		msg: msg,
		url: req.url,
		config: userConfig,
		STRING : configMaster.STRING,
		patient: req.params.patient,
		CLASS: {
			DAY  : configMaster.STRING.DEFAULT.period === configMaster.STRING.DAY   ? "default":"",
			MONTH: configMaster.STRING.DEFAULT.period === configMaster.STRING.MONTH ? "default":"",
			YEAR : configMaster.STRING.DEFAULT.period === configMaster.STRING.YEAR  ? "default":"",
			ALL  : configMaster.STRING.DEFAULT.period === configMaster.STRING.ALL   ? "default":"", 
			SUM  : configMaster.STRING.DEFAULT.method === configMaster.STRING.SUM   ? "default":""
		}
	});
};
