//internal functions

config = require('./config');

var constructDisplayObject = function(doc) {
	var objectDate = new Date(doc.doc.TS);
	displayObject = {
		LS : 0,
		RS : 0,
		SS : 0,
		SU : 0,
		SD : 0,	
		TN: 0, // is TN conditional?
		ndocs: 0,
		//method: config.method,
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
var applyMethod = function(displayObject, singledoc, a) {

	var ret = undefined;
	displayObject.date = new Date(displayObject.TS);
	singledoc.doc.date = new Date(singledoc.doc.TS);

	//data must be returned sorted in order to make this conditional valid
	if (config.isSameTimePeriod(displayObject, singledoc)) {
		config.method(displayObject, singledoc, a);
	} else {
		//begin another set of bars on the graphic
		ret = constructDisplayObject(singledoc);
		displayObject = ret;
		config.method(ret, singledoc, a);
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
var process = function(alldocs) {
	
	var displayObject = undefined;
	var alldisplayObjects = [];

	for (y in alldocs) {

		singledoc = alldocs[y];
		for (actionindex in config.showActions) {
			action = config.ACTIONS[actionindex];
			//console.log(action);
			// only process this doc if it contains the requested action;
			if (singledoc.doc[action] && singledoc.doc[action] > 0) {
				//console.log('-----element-----');
				//console.log(singledoc);
				
				//console.log('StringToDateTest')
				//console.log(singledoc.doc.TS);
				//console.log(new Date(Date.parse(singledoc.doc.TS)));
				//console.log(new Date(singledoc.doc.TS));
				singledoc.doc.TS = new Date(singledoc.doc.TS);
				
				var isInPeriod = ( singledoc.doc.TS.getTime() >= config.startTime.getTime() &&
					singledoc.doc.TS.getTime() <= config.endTime.getTime());
				
				//console.log('singledoc.doc.TS = ', singledoc.doc.TS,
				//	config.startTime, config.endTime);
				//console.log('inside requested time period = ', isInPeriod);

				if(isInPeriod) {

					//core function. Apply the appropriate processing
					if (displayObject === undefined)
						displayObject = constructDisplayObject(singledoc);
					var ret = applyMethod(displayObject, singledoc, action);
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

exports.update = function(req, res, next) {
	console.log('chart update request from', req.body.requrl);
	req.body.startTime = new Date(req.body.startTime).fromLocalISOString();
	req.body.endTime = new Date(req.body.endTime).fromLocalISOString();
	console.log(req.body);
	config.updateConfiguration(
		req.body.startTime, req.body.endTime, req.body.period, req.body.method);
	res.redirect(req.body.requrl);
};

exports.example = function(req, res, next) {
	res.render('graphics/example');
};

exports.summary = function(req, res, next) {
	cloudant.database(req.params.patient);
	cloudant.db.all({ include_docs : true, ascending: true}, function(err, alldocs) {
		//console.log(alldocs);
		if (err) {
			console.log(err);
			res.render('graphics/example', {
				msg : msg
			});
			msg = '';
		} else {
			config.defaultConfiguration();
			//console.log(alldocs);
			//var alldocsSorted = alldocs.sort(timeSort);
			//console.log('----docs sorted----');
			//console.log(alldocsSorted);
			var s = process(alldocs);
			console.log(s.length);
			//console.log(s);

			res.render('graphics/display', {
				msg: msg,
				url: req.url,
				data: s,
				config: config,
				patient: req.params.patient,
				autofill : {
					url                : req.url,
					startTime          : config.startTime.toLocalISOString().slice(0, -1),
					endTime            : config.endTime.toLocalISOString().slice(0, -1),
					isDayRadioChecked  : config.period === config.STRING.DAY   ? "checked":"",
					isMonthRadioChecked: config.period === config.STRING.MONTH ? "checked":"",
					isYearRadioChecked : config.period === config.STRING.YEAR  ? "checked":"",
					isAllRadioChecked  : config.period === config.STRING.ALL   ? "checked":"",
					isSumRadioChecked  : "checked"
				}
			});
		}
	});
};
