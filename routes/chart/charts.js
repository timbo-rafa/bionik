//internal functions

configMaster = require('./config');
methods = require('./methods');

FULLNAME = {
	LS: 'Left step(s)',
	RS: 'Right step(s)',
	SS: 'Continuous step(s)',
	SU: 'Sit down(s)',
	SD: 'Stand up(s)',
	TN: 'Trajectory number',
	TS: 'Timestamp'
};

var constructDisplayObject = function(doc, userConfig) {
	var objectDate = new Date(doc.doc.TS);
	displayObject = {
		LS : 0,
		RS : 0,
		SS : 0,
		SU : 0,
		SD : 0,	
		TN: 0, // is TN conditional?
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
	
	//console.log('---displayObject---');
	//console.log(displayObject);
	return ret;
};

// Calculate the sum from all the step variables
var process = function(alldocs, userConfig) {
	
	var displayObject = undefined;
	var alldisplayObjects = [];

	console.log('process: ', alldocs.length, userConfig);
	for (var y in alldocs) {

		var singledoc = alldocs[y];
		for (var actionindex in userConfig.showActions) {
			var action = userConfig.showActions[actionindex];
			//console.log('  ',action);
			// only process this doc if it contains the requested action;
			if (singledoc.doc[action] && singledoc.doc[action] > 0) {
				//console.log('    ',singledoc);
				
				//console.log('StringToDateTest')
				//console.log(singledoc.doc.TS);
				//console.log(new Date(Date.parse(singledoc.doc.TS)));
				//console.log(new Date(singledoc.doc.TS));
				singledoc.doc.TS = new Date(singledoc.doc.TS);
				
				var isInPeriod = ( singledoc.doc.TS.getTime() >=
					userConfig.startTime.getTime() &&
					singledoc.doc.TS.getTime() <=
					userConfig.endTime.getTime());
				
				//console.log('singledoc.doc.TS = ', singledoc.doc.TS,
				//	config.startTime, config.endTime);
				//console.log('inside requested time period = ', isInPeriod);

				if(isInPeriod) {

					//core function. Apply the appropriate processing
					if (displayObject === undefined)
						displayObject = constructDisplayObject(singledoc, userConfig);
					var ret = applyMethod(displayObject, singledoc, action, userConfig);
					if (ret) {
						//console.log('----pushing this----');
						//console.log(displayObject);
						alldisplayObjects.push(displayObject);
						displayObject = ret;
					}

				}
			}
		}
		if (displayObject) displayObject.ndocs += 1;
	}
	if (displayObject) {
		//console.log('----pushing this----');
		//console.log(displayObject);
		alldisplayObjects.push(displayObject);
	}
	console.log('forEach ENDED');
	return alldisplayObjects;
};

exports.queryDataUpdate = function(config, query) {
	console.log(query);
	configMaster.updateConfigurationQuery(config, query);
	//configMaster.updateConfiguration(config, req.body.startTime, req.body.endTime,
	//	req.body.period, req.body.method, req.session.userConfig.showActions);
};

exports.example = function(req, res, next) {
	res.render('charts/example');
};

exports.formatForGoogleCharts = function(allDisplayObjects, config) {
	console.log('formatForGoogleCharts');
	var googleChartsFormattedData = [];
	var header = ["Period"];
	// Header

//  |     [ 'Period'
//  - each action in config.showActions
//          ,  '#{action}'
//  |     ],  
	for (actionidx in config.showActions) {
		var actionAcronym = config.showActions[actionidx];
		header.push(configMaster.FULLNAME[actionAcronym]);	
	}
	googleChartsFormattedData.push(header);

//  - each d in data
//    | ['#{d.period}'
//    - each action in config.showActions
//      |, #{d[action]}
//    | ],  
	for (idx in allDisplayObjects) {
		var displayObject = allDisplayObjects[idx];
		var data = [displayObject.period];
		//console.log('displayObject: ', displayObject);
		for (actionidx in config.showActions) {
			action = config.showActions[actionidx];
			data.push(displayObject[action]);
		}
		googleChartsFormattedData.push(data);
	}
	console.log('googleData: ', googleChartsFormattedData);
	
	return googleChartsFormattedData;
};

// Functions that receives the data from cloudant and
// generates objects suitable for plotting the charts
exports.processData = function(session, callback) {

//	console.log('processData userConfig before everything:',session.userConfig);
	cloudant.database(session.patient);
	cloudant.db.all({ include_docs : true, ascending: true}, function(err, alldocs) {
		//console.log(alldocs);
		if (err) {
			console.log('Error retrieving Cloudant data:');
			console.log(err);
		} else {
			//console.log('req.session after:',req.session);
			//console.log(alldocs);
			//var alldocsSorted = alldocs.sort(timeSort);
			//console.log('----docs sorted----');
			//console.log(alldocsSorted);
			session.userConfig = sessionConfig(session);	
			var chartData = process(alldocs, session.userConfig);
			console.log(chartData.length);
			//console.log(chartData);
		}
		callback(err, chartData);
	});
};

sessionConfig = function(session) {
	var userConfig = session.userConfig;
	if (userConfig === undefined) {
		userConfig = configMaster.newConfiguration();
		//req.session.userConfig.defaultConfiguration();
	}
	if (typeof userConfig.startTime == 'string' || userConfig.startTime instanceof String)
		userConfig.startTime = new Date(userConfig.startTime);
	if (typeof userConfig.endTime == 'string' || userConfig.endTime instanceof String)
		userConfig.endTime = new Date(userConfig.endTime);
	//console.log('userConfig:', userConfig);
	session.userConfig = userConfig;
	return userConfig;
}

exports.summary = function(req, res, next) {
	console.log('exports.summary. patient:', req.params.patient);
	req.session.patient = req.params.patient;
	req.session.userConfig = sessionConfig(req.session);
	req.session.userConfig.patient = req.params.patient;
	var userConfig = req.session.userConfig;
	res.render('charts/display', {
		msg: msg,
		url: req.url,
		config: userConfig,
		STRING : configMaster.STRING,
		patient: req.params.patient,
		autofill : {
			url                : req.url,
			startTime          : userConfig.startTime.toISOString(),
			endTime            : userConfig.endTime.toISOString(),
			isDayRadioChecked  : userConfig.period === configMaster.STRING.DAY   ? "checked":"",
			isMonthRadioChecked: userConfig.period === configMaster.STRING.MONTH ? "checked":"",
			isYearRadioChecked : userConfig.period === configMaster.STRING.YEAR  ? "checked":"",
			isAllRadioChecked  : userConfig.period === configMaster.STRING.ALL   ? "checked":"",
			isSumRadioChecked  : "checked"
		}
	});
};
