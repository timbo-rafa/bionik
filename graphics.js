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
	showAll: true,
	showAction: "ss",
	timePeriod: SPAN.YEARLY, //not used up to now
	method: "sum",
	startTime: new Date(0),
	endTime  : new Date(),
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
		action: "sum",
		tn: 0, // is tn conditional?
		ndocs: 0,
		period: config.getPeriod(objectDate),
		timestamp: objectDate,
		time: objectDate.getTime(),
		newesttimestamp: new Date(0),
		oldesttimestamp: new Date()
	};

	if (config.showAll) {
		displayObject.ls = 0;
		displayObject.rs = 0;
		displayObject.ss = 0;
		displayObject.su = 0;
		displayObject.sd = 0;
	// only set the keys that are gonna be used, not all
	} else {
		displayObject[config.showAction] = 0;
	}
	return displayObject;
};

var sum = function(displayObject, singledoc, a) {
	//console.log('---sum---');
	//console.log(displayObject);
	//console.log(singledoc);
	//console.log(a);
	displayObject[a] += parseInt(singledoc.doc[a],10);
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

	if (config.isSameTimePeriod(displayObject, singledoc)) {
		config.methodCall(displayObject, singledoc, a);
	} else {
		//begin another graphic
		ret = constructDisplayObject(singledoc);
		config.methodCall(ret, singledoc, a);
	}
	return ret;
};

var defaultConfiguration = function() {
	config.getPeriod = getPeriodMonthly;
	config.methodCall = sum;
	config.isSameTimePeriod = isSameTimePeriodMonthly;
};

// Calculate the sum from all the step variables
var process = function(alldocs) {
	
	defaultConfiguration();
	
	var displayObject = constructDisplayObject(alldocs[0]);
	var alldisplayObjects = [displayObject];
	/* {
		// simple version:
		"action": "sum",
		"ls": 0,
		"rs": 0,
		"ss": 0,
		"su": 0,
		"sd": 0,
		"tn": 0,
		"ndocs": 0,
		"timestamp": Date(),
		"newesttimestamp": new Date(0),
		"oldesttimestamp": new Date(),
	};
	*/

	for (y in alldocs) {
		singledoc = alldocs[y];
		action = singledoc.doc.action;
		if(!(action instanceof Array)) action = [action];
		console.log('[action]');
		console.log(action);
		for (ac in action) {
			var a = action[ac];
			console.log(a);
			// only process this doc if it contains the requested action;
			if(config.showAll || a === config.showAction) {
				//console.log('-----element-----');
				//console.log(singledoc);
				
				//console.log('StringToDateTest')
				//console.log(singledoc.doc.timestamp);
				//console.log(new Date(Date.parse(singledoc.doc.timestamp)));
				//console.log(new Date(singledoc.doc.timestamp));
				singledoc.doc.timestamp = new Date(singledoc.doc.timestamp);
				
				if(singledoc.doc.timestamp.getTime() >= config.startTime.getTime() &&
					singledoc.doc.timestamp.getTime() <= config.endTime.getTime()) {
					if(a === undefined) {
						console.log('action undefined.')
					} else {
						//legacy code. makes sure the action is a summable number, not boolean
						if (singledoc.doc[a] === true) singledoc.doc[a] = 1; 

						//core function. Apply the appropriate processing
						var ret = applyMethod(displayObject, singledoc, a);
						if (ret) {
							displayObject = ret;
							alldisplayObjects.push(ret);
						}
						if (displayObject.newesttimestamp.getTime() < singledoc.doc.timestamp.getTime())
							// x was generated later than s newest doc. Update
							displayObject.newesttimestamp = singledoc.doc.timestamp;
						if (displayObject.oldesttimestamp.getTime() > singledoc.doc.timestamp.getTime())
							// x was generated before than s oldest doc. Update
							displayObject.oldesttimestamp = singledoc.doc.timestamp;
						
						//displayObject[a] += parseInt(singledoc.doc[a],10);
						
						//console.log('---displayObject---');
						//console.log(displayObject);
					}
				}
			}
		}
		displayObject.ndocs += 1;
	};

	console.log('forEach ENDED');
	return alldisplayObjects;
};

exports.example = function(req, res, next) {
	conn.database('chart');
	res.render('graphics/example');
};

var timeSort = function(a, b) {
	return a.doc.time - b.doc.time;
}

exports.summary = function(req, res, next) {
	var db = conn.database(req.params.patient);
	db.all({ include_docs : true, sort: "time"}, function(err, alldocs) {
		console.log(alldocs);
		if (err) {
			console.log(err);
			res.render('graphics/example', {
				msg : msg
			});
			msg = '';
		} else {
			//var alldocsSorted = alldocs.sort(timeSort);
			var s = process(alldocs);
			console.log(s);

			res.render('graphics/display', {
				msg: msg,
				data: s,
				config: config,
			patient: req.params.patient
});
		}
	});
};
