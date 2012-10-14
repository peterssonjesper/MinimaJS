minimajs.drivers.Websocket = (function() {

	try {
		var Websocket = window.WebSocket || window.MozWebSocket;
	} catch(e) {}

	var connection;
	var deltas = [];
	var unconfirmed = false;

	var commit = function(msg) {
		minimajs.debug("Message: " + msg.cmd + " on " + msg.data.identifier);

		// Revert all changes made to this model
		for(var i=deltas.length-1; i >= 0; i--) {
			if(unconfirmed !== false && msg.data.identifier === deltas[i].identifier) {
				this.app.message.send('collection', 'revert', deltas[i]);
				deltas.splice(i, 1);
			}
		}

		// Clear unconfirmed if the sent is a commited one
		if(unconfirmed !== false && msg.data.identifier === unconfirmed.identifier) {
			// Might have been localy removed, now remote commit. Move to models
			this.app.message.send('collection', 'revert', unconfirmed);
		}
		this.app.message.send('collection', 'commit', msg.data);
	};

	var ack_nack = function(msg, nack) {
		if(nack !== true) { // Ack
			unconfirmed.revision = msg.revision;
			this.app.message.send('collection', 'commit', unconfirmed);
		}
		unconfirmed = false;
		saveItem.call(this);
	};

	var saveItem = function() {

		if(deltas.length === 0 || unconfirmed !== false) {
			return;
		}
		var delta = deltas.splice(0, 1)[0];
		unconfirmed = minimajs.clone(delta);
		minimajs.debug("Save " + delta.identifier + ", " + deltas.toString());

		if(delta.change === 3) { // Remove
			connection.send(JSON.stringify({'cmd' : 'remove', 'data' : {'identifier' : delta.identifier, 'collectionId' : delta.collectionId, 'change' : delta.change, 'revision' : delta.revision }}));
		}
		else if(delta.change === 1) { // Insert
			connection.send(JSON.stringify({'cmd' : 'insert', 'data' : delta}));
		}
		else { // Change
			connection.send(JSON.stringify({'cmd' : 'update', 'data' : delta}));
		}
	};

	var fetch = function(collectionId, callback) {
		connection.send(JSON.stringify({'cmd' : 'get'}));
		on('get', function(data) {
			callback({'data' : data.data});
		});
	};

	var callbacks = {};

	var on = function(cmd, callback) {
		if(callback) {
			callbacks[cmd] = callback;
		}
	};

	var call = function(cmd, args) {
		if(callbacks[cmd] !== undefined) {
			callbacks[cmd].call(this, args);
		}
	};

	this.app = undefined;

	this.init = function() {
		var self = this;

		on('ack', ack_nack, function(arg) {
			ack_nack.call(self, arg, false); // Ack
		});
		on('nack', function(arg) {
			ack_nack.call(self, arg, true); // Nack
		});
		on('insert', function(msg) {
			commit.call(self, msg);
		});
		on('update', function(msg) {
			commit.call(self, msg);
		});
		on('remove', function(msg) {
			commit.call(self, msg);
		});

		// Returns list of data-entries of type object though the callback
		this.app.message.listen('api', 'fetch', function(collectionId, callback) {
			fetch.call(self, collectionId, callback);
		});

		// Takes models as input and saves data-entries
		this.app.message.listen('api', 'save', function(new_deltas) {
			for(var i in new_deltas) {
				minimajs.debug("Adding change: " + new_deltas[i].identifier);
				deltas.push(new_deltas[i]);
			}
			minimajs.debug("After adding: " + deltas.toString());
			saveItem.call(self);
		});

	};

	this.start = function(callback) {
		connection = new WebSocket(minimajs.config.driverUri, minimajs.config.driverProtocol);
		connection.onopen = function() {
			callback();
		};
		connection.onmessage = function(msg) {
			var m;
			try {
				m = JSON.parse(msg.data);
			} catch(e) {
				minimajs.debug("Warning. Could not parse answer from server. Does not seem to be JSON:");
				minimajs.debug(msg.data);
				return;
			}
			call.call(self, m.cmd, m);
		};
	};

	// Creates a new, clean, local storage
	this.clean = function() {
		// TBD
	};

}).extend(minimajs.BaseDriver);
