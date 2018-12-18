// methods.js
//
// operations that can be applied to data

exports.sum = function(displayObject, singledoc, action) {
	displayObject[action] += parseInt(singledoc.doc[action], 10);
};
