// cloudant.js
// file responsible for the cloudant connection

// couchdb framework
var cradle = require('cradle');

var account = {
  username: 'bionik',
  password: 'bionik2014ibminternship'
};

// options
var options = {
  host: 'bionik.cloudant.com',
  port: 443,
  auth: account,
  options: {
    cache: true,
    raw: false,
    secure: true
  }
};

var conn;
var db;
//exports.conn = conn;

exports.connect = function() {
	// use cradle framework based on CouchDB to setup cloudant configuration
	cradle.setup(options);

	conn = new(cradle.Connection)();
	// db = /* use local storage data to connect to patient's database */;
};

exports.database = function(dbname) {
	db = conn.database(dbname);
	exports.db = db;
	console.log('db = ', db);
	console.log('exports.db = ', exports.db);
	return db;
};
