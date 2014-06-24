//state variables

var SPAN = {
	HOURLY :{ value: 0, name: "Hourly"},
	DAILY  :{ value: 1, name: "Daily" },
	WEEKLY :{ value: 2, name: "Weekly"},
	MONTHLY:{ value: 3, name: "Monthly"},
	YEARLY :{ value: 4, name: "Yearly"}
};
if (Object.freeze) Object.freeze(SPAN);

var timespan = SPAN.MONTHLY;

var config = {
	showAll: true,
	showAction: "ss",
	method: "sum",
	startTime: new Date(0),
	endTime  : new Date()
};

//internal functions

var constructDisplayObject = function(doc) {
	displayObject = {
		action: "sum",
		tn: 0, // is tn conditional?
		ndocs: 0,
		timestamp: new Date(),
		timespan: new Date(doc.doc.timestamp).getTime(),
		newesttimestamp: new Date(0),
		oldesttimestamp: new Date()
	};

	if (config.showAll) {
		displayObject.ls = 0;
		displayObject.rs = 0;
		displayObject.ss = 0;
		displayObject.su = 0;
		displayObject.sd = 0;
	} else {
		displayObject[config.showAction] = 0;
	}
	return displayObject;
};

var sum = function(displayObject,singledoc, a) {
	displayObject[a] += parseInt(singledoc.doc[a],10);
};
config.methodCall = sum;

var isSameTimeSpanYearly = function(displayObject, singledoc) {
	//Update this when you have appropriate docs in the cloud to the commented code
	//docTime = Number(singledoc.doc.timespan);
	//displayObjectTime = Number(displayObject.timespan);
	docTime = new Date(singledoc.doc.timestamp);
	displayObjectTime = new Date(displayObject.timestamp);

	return docTime.getFullYear() === displayObjectTime.getFullYear();
}

/* variable that will dynamically hold the function to evaluate if the incoming doc is on the
 * same timespan as the previous answer or not ( we should then generate a new displayObject to
 * plot a new graphic
 */
var isSameTimeSpan = function(displayObject, singledoc) {
	return isSameTimeSpanYearly(singledoc);
}

/* function that decides what calculation will be made (with the step variables)
 * and calls the appropriate function
 */
var applyMethod = function(displayObject, singledoc, a) {
	
	if (isSameTimeSpan(displayObject, singledoc))
		config.methodCall(displayObject, singledoc, a);
	else
		//begin another graphic
		config.methodCall(constructDisplayObject(), singledoc, a);
};


// Calculate the sum from all the step variables
var process = function(alldocs) {
	// only set the keys that are gonna be used, not all
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
			// only process this action if it was requested;
			if(config.showAll || a === config.showAction) {
				console.log('-----element-----');
				console.log(singledoc);
				
				console.log('StringToDateTest');
				console.log(singledoc.doc.timestamp);
				console.log(new Date(Date.parse(singledoc.doc.timestamp)));
				singledoc.doc.timestamp = new Date(Date.parse(singledoc.doc.timestamp));
				if (displayObject.newesttimestamp.getTime() < singledoc.doc.timestamp.getTime())
					// x was generated later than s newest doc. Update
					displayObject.newesttimestamp = singledoc.doc.timestamp;
				if (displayObject.oldesttimestamp.getTime() > singledoc.doc.timestamp.getTime())
					// x was generated before than s oldest doc. Update
					displayObject.oldesttimestamp = singledoc.doc.timestamp;
				
				if(singledoc.doc.timestamp.getTime() >= config.startTime.getTime() &&
					singledoc.doc.timestamp.getTime() <= config.endTime.getTime()) {
					if(a === undefined) {
						console.log('action undefined.')
					} else {
						//legacy code. makes sure the action is a summable number, not boolean
						if (singledoc.doc[a] === true) singledoc.doc[a] = 1; 
						


						//core function. Apply
						/*
						var ret = applyMethod(displayObject,singledoc,a);
						if (ret) {
							displayObject = ret;
							alldisplayObjects.push(ret);
						}*/

						displayObject[a] += parseInt(singledoc.doc[a],10);
						
						console.log('---displayObject---');
						console.log(displayObject);
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

exports.summary = function(req, res, next) {
	var db = conn.database(req.params.patient);
	db.all({ include_docs : true }, function(err, alldocs) {
		if (err) {
			//msg = errorMessage(err);
			res.render('graphics/example', {
				msg : msg
			});
			msg = '';
		} else {
			var s = process(alldocs);
			console.log(s);

			/*
			var lineHeaderArray = [];
			var lineArray = [];
			if (config.showAll) {
				lineHeaderArray = "['Period', 'ls', 'rs', 'ss', 'su', 'sd'],";
				lineHeader = "['Sum'," + s.ls, s.rs, s.ss, s.su, s.sd ];
			} else {
				lineHeaderArray = ['Period', config.showAction];
				lineHeader = ['Sum', s[config.showAction] ];
			}
			*/

			res.render('graphics/display', {
				msg: msg,
				data: [s,s],
				config: config,
				patient: req.params.patient
			});
		}
	});
};
