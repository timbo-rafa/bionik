
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
exports.startTime = new Date(0);
exports.endTime = new Date(); //refresh this each time the charts will be generated
exports.method;
exports.getPeriod;
exports.method;
exports.isSameTimePeriod;
exports.period;
exports.actions = [ "ls", "rs", "ss", "sd", "su" ];
exports.ACTIONS = [ "LS", "RS", "SS", "SD", "SU" ];
exports.showActions = exports.ACTIONS;

var MONTHNAME = [ "January", "February", "March", "April", "May", "June", "July", "August",
	"September", "October", "November", "December" ];

if (Object.freeze) {
	Object.freeze(exports.actions);
	Object.freeze(exports.ACTIONS);
	Object.freeze(MONTHNAME);
	Object.freeze(STRING);
}

// turn these into just variables and not functions?
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


exports.updatePeriod = function(period) {
	exports.getPeriod = getPeriod[period];
	exports.isSameTimePeriod = isSameTimePeriod[period];
	exports.period = period;
};

exports.defaultConfiguration = function() {

	if(uninitialized) {
		endTime = new Date(); //refresh end of time period delimiter

		exports.updatePeriod(STRING.MONTH);
		exports.method = methods.sum;

		uninitialized = false;
	}
  return exports;
};

exports.updateConfiguration = function(startTime, endTime, period, method) {
	uninitialized = false;
	exports.startTime = startTime;
	exports.endTime = endTime;
	exports.updatePeriod(period);
	exports.method = methods[method];
	console.log('---config exports---', exports);
};
