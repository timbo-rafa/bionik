// This file holds the methods applied to charts to generate different kind of outputs

exports.sum = function(displayObject, singledoc, action) {
	  console.log('Summing', displayObject[action], '+', singledoc.doc[action]);
		  displayObject[action] += parseInt(singledoc.doc[action],10);
};
