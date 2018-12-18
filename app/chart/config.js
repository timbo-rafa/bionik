// config.js
//
// this file manipulates the parameters and configurations necessary
// to plot and display our chart using Google Chart API

var methods = require('./methods');

//state variables
var uninitialized = true;

// Different actions done by the device.
// This variable is used on a iteration to manipulate the chart's data
exports.actions = [ "ls", "rs", "ss", "sd", "su" ];
exports.ACTIONS = [ "LS", "RS", "SS", "SD", "SU" ];

// constant strings that represents various options of how to display the data in the charts
var STRING = {
	DAY : "day",
	MONTH : "month",
	YEAR : "year",
	ALL : "all",
	SUM : "sum"
};

// default values for the chart data
var DEFAULT = {
	starttime: new Date(0).toISOString(),
	endtime: new Date().toISOString(),
	period: STRING.DAY,
	method: STRING.SUM,
	showactions: exports.ACTIONS
};

STRING.DEFAULT = DEFAULT;

// conversion of numerical months to corresponding names
var MONTHNAME = [ "January", "February", "March", "April", "May", "June", "July", "August",
	"September", "October", "November", "December" ];

// Do not alter constants
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

exports.STRING = STRING;
exports.methods = methods;
exports.getPeriod = getPeriod;
exports.isSameTimePeriod = isSameTimePeriod;

// update the chart config configuration
exports.updateConfigurationQuery = function(config, query) {
	for (keyname in query) {
		keyname = keyname.toLowerCase();
		if (config[keyname]) {
			//translate "default" string into the actual default configuration
			query[keyname] = query[keyname].toLowerCase();
			if (query[keyname] === "default")
				config[keyname] = DEFAULT[keyname];
			// update the config value
			else config[keyname] = query[keyname];
		} else {
			console.log('Key ', keyname, ' not defined. Skipping it.');
		}
	}
};

// update the configuration according to the given parameters
exports.updateConfiguration = function(config, starttime, endtime, period, method, showactions) {
		config.showactions = showactions;
		config.uninitialized = false;
		config.unitialized = false;
		config.period = period;
		config.method = method;
};

// same as above, but update the configuration to the default.
// Also create a new config object if none is given
defaultConfiguration = function(config) {

	if (!config) {
		config = {};
	}
	config.starttime = DEFAULT.starttime;
	config.endtime   = DEFAULT.endtime;
	config.period    = DEFAULT.period;
	config.method    = DEFAULT.method;
	config.showactions   = DEFAULT.showactions;

	return config;
};

exports.defaultConfiguration = defaultConfiguration;
