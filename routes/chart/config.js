
var methods = require('./methods.js');
//state variables

var uninitialized = true;

exports.actions = [ "ls", "rs", "ss", "sd", "su" ];
exports.ACTIONS = [ "LS", "RS", "SS", "SD", "SU" ];

var STRING = {
	DAY : "day",
	MONTH : "month",
	YEAR : "year",
	ALL : "all",
	SUM : "sum"
};

var DEFAULT = {
	starttime: new Date(0).toISOString(),
	endtime: new Date().toISOString(),
	period: STRING.DAY,
	method: STRING.SUM,
	showactions: exports.ACTIONS
};

STRING.DEFAULT = DEFAULT;
exports.STRING = STRING;


exports.FULLNAME = {
	LS: 'Left step(s)',
	RS: 'Right step(s)',
	SS: 'Continuous step(s)',
	SU: 'Sit down(s)',
	SD: 'Stand up(s)',
	TN: 'Trajectory number',
	TS: 'Timestamp'
};


var MONTHNAME = [ "January", "February", "March", "April", "May", "June", "July", "August",
	"September", "October", "November", "December" ];

if (Object.freeze) {
	Object.freeze(exports.actions);
	Object.freeze(exports.ACTIONS);
	Object.freeze(MONTHNAME);
	Object.freeze(STRING);
}

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
		keyname = keyname.toLowerCase();
		//console.log('keyname = ', keyname, '| query[keyname] = ', query[keyname]);
		if (config[keyname]) {
			//translate "default" string into the actual default configuration
			query[keyname] = query[keyname].toLowerCase();
			if (query[keyname] === "default")
				config[keyname] = DEFAULT[keyname];
			else config[keyname] = query[keyname];
		} else {
			console.log('Key ', keyname, ' not defined. Skipping it.');
		}
	}
	console.log('config after updateQuery: ', config);
};

exports.updateConfiguration = function(config, starttime, endtime, period, method, showactions) {
		//console.log('---config this b4---', this);

		config.showactions = showactions;
		config.uninitialized = false;
		config.unitialized = false;
		config.period = period;
		config.method = method;
		//console.log('---config this after---', this);
};

defaultConfiguration = function(config) {
	config.starttime = DEFAULT.starttime;
	config.endtime   = DEFAULT.endtime;
	config.period    = DEFAULT.period;
	config.method    = DEFAULT.method;
	config.showactions   = DEFAULT.showactions;
};

exports.newConfiguration = function () {

	var configInstance = {};
	
//	configInstance.updateConfiguration = function(starttime, endtime, period, method, showactions) {
//		//console.log('---config this b4---', this);
//		this.showactions = showactions;
//		this.uninitialized = false;
//		this.starttime = starttime;
//		this.endtime = endtime;
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
