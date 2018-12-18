// cloudant.js
// file responsible for the cloudant connection configuration

// couchdb framework
var cradle = require('cradle');

var account = {
  username: (process.env.CLOUDANT_USERNAME || 'bionikbluemix'),
  password: (process.env.CLOUDANT_PASSWORD || 'bionik2014ibminternship')
};

// options
var options = {
  host: account.username + '.cloudant.com',
  port: 443,
  auth: account,
  options: {
    cache: true,
    raw: false,
    secure: true
  }
};

var conn;

// db holds the database connection and is used with common database operations
// and http verbs, such as get, post, put, delete
var db;

exports.connect = function() {
	// use cradle framework based on CouchDB to setup cloudant configuration
	cradle.setup(options);

	conn = new(cradle.Connection)();
	// db = /* use local storage data to connect to patient's database */;
};

exports.database = function(dbname) {
	
	if (conn === undefined)
		exports.connect();
	db = conn.database(dbname);
	exports.db = db;
	//console.log('db = ', db);
	//console.log('exports.db = ', exports.db);
	return db;
};
