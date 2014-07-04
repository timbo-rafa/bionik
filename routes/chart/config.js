
var methods = require('./methods.js');
//state variables

// not used (yet?)
var SPAN = [
  { name: "All"},
  //HOURLY :{ value: 1, name: "Hourly"},
  { name: "Day" },
  //WEEKLY :{ value: 3, name: "Weekly"},
  { name: "Month"},
  { name: "Year"}
];

exports.timePeriod = SPAN.MONTHLY; //not used yet
exports.startTime = new Date(0);
exports.endTime = new Date(); //refresh this each time the charts will be generated
exports.method; //not used yet
exports.getPeriod;
exports.methodCall;
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
	Object.freeze(SPAN);
}

var getPeriod = {};

getPeriod["All"] = function(date) {
	return "All data";
};

getPeriod["Year"] = function(date) {
	return date.getFullYear().toString();
};

getPeriod["Month"] = function(date) {
	return MONTHNAME[date.getMonth()] + ', ' + getPeriod["Year"](date);
};

getPeriod["Day"] = function(date) {
	return date.getDate() + ', ' + getPeriod["Month"](date);
};

var isSameTimePeriod = {};

isSameTimePeriod["All"] = function(displayObject, singledoc) {
	return true;
};

isSameTimePeriod["Year"] = function(displayObject, singledoc) {
  return singledoc.doc.date.getFullYear() === displayObject.date.getFullYear();
};

isSameTimePeriod["Month"] = function(displayObject, singledoc) {
  var isSamePeriodYear = isSameTimePeriod["Year"](displayObject, singledoc);

  return ( isSamePeriodYear &&
    ( singledoc.doc.date.getMonth() === displayObject.date.getMonth() )
  );
};

isSameTimePeriod["Day"] = function(displayObject, singledoc) {
  var isSamePeriodMonth = isSameTimePeriod["Month"](displayObject, singledoc);

  return ( isSamePeriodMonth &&
    ( singledoc.doc.date.getDate() === displayObject.date.getDate() )
  );
};

var periodUpdate = function(period) {
	exports.getPeriod = getPeriod[period];
	exports.isSameTimePeriod = isSameTimePeriod[period];
	exports.period = period;
};

exports.defaultConfiguration = function() {

  endTime = new Date(); //refresh end of time period delimiter

	periodUpdate("Month");
  exports.methodCall = methods.sum;
  return exports;
};
