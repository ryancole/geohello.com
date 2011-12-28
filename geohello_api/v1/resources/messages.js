var mongo = require('mongodb'), app = module.parent.exports.app;

/**
 * GET: read message data from the database.
 */

app.get('/api/messages', function(req, res) {

	// default selector includes all messages; default filter
	// limits to the newest, single document.
	var selector = {}, options = {
		limit : 50,
		sort : [['_id', -1]]
	};

	// lets check for the limit option, first; max of 20.
	if('limit' in req.query && req.query.limit.length > 0)
		options.limit = (parseInt(req.query.limit) > 50 ? 50 : parseInt(req.query.limit));

	// delta checks for new messages since a previous message.
	if('delta' in req.query && req.query.delta.length > 0)
		selector._id = {
			$gt : new mongo.ObjectID(req.query.delta)
		};

	// loc applies the location-based parameters
	if('loc' in req.query && req.query.loc.split(',').length == 2)
		selector.loc = {
			$within : {
				$center : [[parseFloat(req.query.loc.split(',')[0]), parseFloat(req.query.loc.split(',')[1])], 0.428]
			}
		};

	var db = new mongo.Db('geohello', new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT, {
		'auto_reconnect' : true
	}));

	db.open(function(err, db) {
		db.collection('messages', function(err, collection) {
			collection.find(selector, options, function(err, cursor) {
				cursor.toArray(function(err, docs) {

					var payload = new Array();

					// push all document results into the outbound payload.
					docs.forEach(function(doc) {
						payload.push(doc);
					});

					res.send(payload);

					// close the database connection.
					db.close();

				});
			});
		});
	});
});

/**
 * POST: insert message data into the database.
 */

app.post('/api/messages', function(req, res) {

	// make sure the user actually posted a valid message.
	// requirements: msg, and loc. msg length more gt two. loc contains two values.
	if(req.body && ('msg' in req.body) && (req.body.msg.length > 0) && ('loc' in req.body) && (req.body.loc.split(',').length == 2) && ('uid' in req.body) && (req.body.uid.length > 0)) {

		// split the message out into its parts, and store it in the database.
		var loc = req.body.loc.split(','), msg = req.body.msg.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").substring(0, 160), uid = req.body.uid.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").substring(0, 12), doc = {
			uid : uid,
			msg : msg,
			loc : [parseFloat(loc[0]), parseFloat(loc[1])]
		};

		// make sure uid is at least two chars.
		if(uid.length < 2) {
			doc.uid = 'user_hax';
		}

		// if the user provided a location name, save it too.
		if('locname' in req.body) {
			var locname = req.body.locname.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").substring(0, 24);
			if(locname.length > 2) {
				doc.locname = locname;
			}
		}

		var db = new mongo.Db('geohello', new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT, {
			'auto_reconnect' : true
		}));
		db.open(function(err, db) {
			db.collection('messages', function(err, collection) {
				collection.insert(doc, function(err, docs) {
					res.send({
						ok : 1,
						doc : docs[0]
					});
					db.close();
				});
			});
		});
	} else {
		res.send({
			ok : 0
		});
	}
});
