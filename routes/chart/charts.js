//state variables

// not used (yet?)
var SPAN = {
	HOURLY :{ value: 0, name: "Hourly"},
	DAILY  :{ value: 1, name: "Daily" },
	WEEKLY :{ value: 2, name: "Weekly"},
	MONTHLY:{ value: 3, name: "Monthly"},
	YEARLY :{ value: 4, name: "Yearly"/*, func: isSameTimePeriodYearly */},
	ALL:{ value: 5, name: "All"}
};

if (Object.freeze) Object.freeze(SPAN);

var MONTHNAME = [];

ACTIONS = [ "ls", "rs", "ss", "sd", "su" ];
if (Object.freeze) Object.freeze(ACTIONS);

MONTHNAME.push("January");
MONTHNAME.push("February");
MONTHNAME.push("March");
MONTHNAME.push("April");
MONTHNAME.push("May");
MONTHNAME.push("June");
MONTHNAME.push("July");
MONTHNAME.push("August");
MONTHNAME.push("September");
MONTHNAME.push("October");
MONTHNAME.push("November");
MONTHNAME.push("December");
if (Object.freeze) Object.freeze(MONTHNAME);

var config = {
	showActions: ACTIONS,
	timePeriod: SPAN.YEARLY, //not used up to now
	method: "sum",
	startTime: new Date(0),
	endTime  : new Date(), //refresh this time each time the graphics is displayed again
	//getPeriod;
	//methodCall;
	//isSameTimePeriod;
};

var getPeriodYearly = function(date) {
	return date.getFullYear().toString();
};

var getPeriodMonthly = function(date) {
	return MONTHNAME[date.getMonth()] + ', ' + getPeriodYearly(date);
};

var getPeriodDaily = function(date) {
	return date.getDate() + ', ' + getPeriodMonthly(date);
};
//internal functions

var constructDisplayObject = function(doc) {
	var objectDate = new Date(doc.doc.timestamp);
	displayObject = {
		ls : 0,
		rs : 0,
		ss : 0,
		su : 0,
		sd : 0,	
		tn: 0, // is tn conditional?
		ndocs: 0,
		method: "sum",
		period: config.getPeriod(objectDate),
		timestamp: objectDate,
		time: objectDate.getTime(),
		newesttimestamp: new Date(0),
		oldesttimestamp: new Date()
	};
	return displayObject;
};

var sum = function(displayObject, singledoc, action) {
	console.log('Summing', displayObject[action], '+', singledoc.doc[action]);
	displayObject[action] += parseInt(singledoc.doc[action],10);
};

var isSameTimePeriodYearly = function(displayObject, singledoc) {
	return singledoc.doc.date.getFullYear() === displayObject.date.getFullYear();
};

var isSameTimePeriodMonthly = function(displayObject, singledoc) {
	var isSamePeriodYearly = isSameTimePeriodYearly(displayObject, singledoc);

	return ( isSamePeriodYearly &&
		( singledoc.doc.date.getMonth() === displayObject.date.getMonth() )
	);
};

var isSameTimePeriodDaily = function(displayObject, singledoc) {
	var isSamePeriodMonthly = isSameTimePeriodMonthly(displayObject, singledoc);

	return ( isSamePeriodMonthly &&
		( singledoc.doc.date.getDate() === displayObject.date.getDate() )
	);
};

/* variable that will dynamically hold the function to evaluate if the incoming doc is on the
 * same timeperiod as the previous answer or not ( we should then generate a new displayObject to
 * plot a new graphic
 */

/* function that decides what calculation will be made (with the step variables)
 * and calls the appropriate function using the appropriate configs
 */
var applyMethod = function(displayObject, singledoc, a) {

	var ret = undefined;
	displayObject.date = new Date(displayObject.timestamp);
	singledoc.doc.date = new Date(singledoc.doc.timestamp);

	//data must be returned sorted in order to make this conditional valid
	if (config.isSameTimePeriod(displayObject, singledoc)) {
		config.methodCall(displayObject, singledoc, a);
	} else {
		//begin another set of bars on the graphic
		ret = constructDisplayObject(singledoc);
		displayObject = ret;
		config.methodCall(ret, singledoc, a);
	}
	
	//timestamp management
	if (displayObject.newesttimestamp.getTime() < singledoc.doc.timestamp.getTime())
		// singledoc was generated later than displayObject newest doc. Update
		displayObject.newesttimestamp = singledoc.doc.timestamp;
	if (displayObject.oldesttimestamp.getTime() > singledoc.doc.timestamp.getTime())
		// singledoc was generated before than displayObject oldest doc. Update
		displayObject.oldesttimestamp = singledoc.doc.timestamp;
	displayObject.ndocs += 1;
	
	//console.log('---displayObject---');
	//console.log(displayObject);
	return ret;
};

var defaultConfiguration = function() {

	config.showActions = ACTIONS; // display all actions by default
	config.endTime = new Date(); //refresh end of time period delimiter

	config.getPeriod = getPeriodMonthly;
	config.methodCall = sum;
	config.isSameTimePeriod = isSameTimePeriodMonthly;
	//config.period = 
	return config;
};

// Calculate the sum from all the step variables
var process = function(alldocs) {
	
	defaultConfiguration();
	
	var displayObject = undefined;
	var alldisplayObjects = [];

	for (y in alldocs) {

		singledoc = alldocs[y];
		for (actionindex in config.showActions) {
			action = ACTIONS[actionindex];
			console.log(action);
			// only process this doc if it contains the requested action;
			if (singledoc.doc[action] && singledoc.doc[action] > 0) {
				console.log('-----element-----');
				console.log(singledoc);
				
				//console.log('StringToDateTest')
				//console.log(singledoc.doc.timestamp);
				//console.log(new Date(Date.parse(singledoc.doc.timestamp)));
				console.log(new Date(singledoc.doc.timestamp));
				singledoc.doc.timestamp = new Date(singledoc.doc.timestamp);
				
				var isInPeriod = ( singledoc.doc.timestamp.getTime() >= config.startTime.getTime() &&
					singledoc.doc.timestamp.getTime() <= config.endTime.getTime());
				console.log('singledoc.doc.timestamp = ', singledoc.doc.timestamp,
					config.startTime, config.endTime);
				console.log('inside requested time period = ', isInPeriod);

				if(isInPeriod) {

					//core function. Apply the appropriate processing
					if (displayObject === undefined)
						displayObject = constructDisplayObject(singledoc);
					var ret = applyMethod(displayObject, singledoc, action);
					if (ret) {
//						console.log('----pushing this----');
//						console.log(displayObject);
						alldisplayObjects.push(displayObject);
						displayObject = ret;
					}

				}
			}
		}
	};
	if (displayObject) {
		console.log('----pushing this----');
		console.log(displayObject);
		alldisplayObjects.push(displayObject);
	}
	console.log('forEach ENDED');
	return alldisplayObjects;
};

exports.example = function(req, res, next) {
	cloudant.database('chart');
	res.render('graphics/example');
};

exports.summary = function(req, res, next) {
	cloudant.database(req.params.patient);
	cloudant.db.all({ include_docs : true, ascending: true}, function(err, alldocs) {
		console.log(alldocs);
		if (err) {
			console.log(err);
			res.render('graphics/example', {
				msg : msg
			});
			msg = '';
		} else {
			//console.log(alldocs);
			//var alldocsSorted = alldocs.sort(timeSort);
			//console.log('----docs sorted----');
			//console.log(alldocsSorted);
			var s = process(alldocs);
			console.log(s.length);
			console.log(s);

			res.render('graphics/display', {
				msg: msg,
				data: s,
				config: defaultConfiguration(),
				patient: req.params.patient
			});
		}
	});
};
