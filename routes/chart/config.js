
var methods = require('./methods.js');
//state variables

var uninitialized = true;

var STRING = {
	DAY : "Day",
	MONTH : "Month",
	YEAR : "Year",
	ALL : "All"
};


exports.STRING = STRING;

exports.actions = [ "ls", "rs", "ss", "sd", "su" ];
exports.ACTIONS = [ "LS", "RS", "SS", "SD", "SU" ];

var MONTHNAME = [ "January", "February", "March", "April", "May", "June", "July", "August",
	"September", "October", "November", "December" ];

if (Object.freeze) {
	Object.freeze(exports.actions);
	Object.freeze(exports.ACTIONS);
	Object.freeze(MONTHNAME);
	Object.freeze(STRING);
}

var DEFAULT = {
	startTime: new Date(0).toISOString(),
	endTime: new Date().toISOString(),
	period: "Month",
	method: "sum",
	showActions: exports.ACTIONS
};

var getPeriod = {};

getPeriod[STRING.ALL] = function(date) {
	return STRING.ALL;
};

getPeriod[STRING.YEAR] = function(date) {
	return date.getFullYear().toString();
};

getPeriod[STRING.MONTH] = function(date) {
	return MONTHNAME[date.getMonth()] + ', ' + getPeriod[STRING.YEAR](date);
};

getPeriod[STRING.DAY] = function(date) {
	return date.getDate() + ', ' + getPeriod[STRING.MONTH](date);
};

var isSameTimePeriod = {};

isSameTimePeriod[STRING.ALL] = function(displayObject, singledoc) {
	return true;
};

isSameTimePeriod[STRING.YEAR] = function(displayObject, singledoc) {
  return singledoc.doc.date.getFullYear() === displayObject.date.getFullYear();
};

isSameTimePeriod[STRING.MONTH] = function(displayObject, singledoc) {
  var isSamePeriodYear = isSameTimePeriod[STRING.YEAR](displayObject, singledoc);

  return ( isSamePeriodYear &&
    ( singledoc.doc.date.getMonth() === displayObject.date.getMonth() )
  );
};

isSameTimePeriod[STRING.DAY] = function(displayObject, singledoc) {
  var isSamePeriodMonth = isSameTimePeriod[STRING.MONTH](displayObject, singledoc);

  return ( isSamePeriodMonth &&
    ( singledoc.doc.date.getDate() === displayObject.date.getDate() )
  );
};

exports.methods = methods;
exports.getPeriod = getPeriod;
exports.isSameTimePeriod = isSameTimePeriod;

exports.updateConfigurationQuery = function(config, query) {
	for (keyname in query) {
		//console.log('keyname = ', keyname, '| query[keyname] = ', query[keyname]);
		if (config[keyname]) {
			//translate "default" string into the actual default configuration
			if (query[keyname] === "default")
				config[keyname] = DEFAULT[keyname];
			else config[keyname] = query[keyname];
		} else {
			console.log('Key ', keyname, ' not defined. Skipping it.');
		}
	}
	console.log('config after updateQuery: ', config);
};

exports.updateConfiguration = function(config, startTime, endTime, period, method, showActions) {
		//console.log('---config this b4---', this);

		config.showActions = showActions;
		config.uninitialized = false;
		config.unitialized = false;
		config.period = period;
		config.method = method;
		//console.log('---config this after---', this);
};

defaultConfiguration = function(config) {
	config.startTime = DEFAULT.startTime;
	config.endTime   = DEFAULT.endTime;
	config.period    = DEFAULT.period;
	config.method    = DEFAULT.method;
	config.showActions   = DEFAULT.showActions;
};

exports.newConfiguration = function () {

	var configInstance = {};
	
//	configInstance.updateConfiguration = function(startTime, endTime, period, method, showActions) {
//		//console.log('---config this b4---', this);
//		this.showActions = showActions;
//		this.uninitialized = false;
//		this.startTime = startTime;
//		this.endTime = endTime;
//		this.updatePeriod(period);
//		this.method = methods[method];
//		//console.log('---config this after---', this);
//	};

//	configInstance.defaultConfiguration = function() {
//
//		//console.log('what is this?', this, 'this is configInstance?', configInstance === this);
//		this.updateConfiguration(new Date('1979/03/03'), new Date(), STRING.MONTH,
//			"sum", exports.ACTIONS);
//		console.log('default configuration:', this);
//		return this;
//	};

	defaultConfiguration(configInstance);
	//console.log('newConfiguration generated:', configInstance);
	return configInstance;
};
