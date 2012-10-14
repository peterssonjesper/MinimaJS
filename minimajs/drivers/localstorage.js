minimajs.drivers.LocalStorage = (function() {

	var localStorageName = 'minimajs';

	this.app = undefined;
	this.deltas = [];

	var getStorage = function() {
		return JSON.parse(localStorage.getItem(localStorageName));
	};

	this.start = function(callback) {
		callback();
	};

	this.init = function() {

		var self = this;

		// If there is no storage, create it
		if(localStorage.getItem(localStorageName) === null) {
			this.clean();
		}

		// Returns list of data-entries of type object though the callback
		this.app.message.listen('api', 'fetch', function(collectionId, callback) {
			fetch.call(self, collectionId, callback);
		});

		// Takes models as input and saves data-entries
		this.app.message.listen('api', 'save', function(deltas) {
			for(var i in deltas) {
				self.deltas.push(deltas[i]);
			}
			saveItem.call(self);
		});
	};

	var saveItem = function() {
		var storage = getStorage();
		var j;

		if(this.deltas.length === 0) {
			return;
		}
		var delta = this.deltas.splice(0, 1)[0];

		storage.collections[delta.collectionId] = storage.collections[delta.collectionId] || [];

		// Store model values in data
		if(delta.change === 3) { // Remove
			for(j in storage.collections[delta.collectionId]) {
				if(storage.collections[delta.collectionId][j].identifier === delta.identifier) {
					storage.collections[delta.collectionId].splice(j, 1); // Remove
					break;
				}
			}
		}
		else if(delta.change === 1) { // Insert
			storage.collections[delta.collectionId].push({
				'identifier' : delta.identifier,
				'values' : delta.values
			});
		}
		else { // Change
			for(j in storage.collections[delta.collectionId]) {
				if(storage.collections[delta.collectionId][j].identifier === delta.identifier) {
					storage.collections[delta.collectionId][j].values = delta.values;
					break;
				}
			}
		}

		localStorage.setItem(localStorageName, JSON.stringify(storage));

		this.app.message.send('collection', 'commit', delta);

		saveItem.call(this);

	};

	var fetch = function(collectionId, callback) {
		var storage = getStorage();
		var answer = {
			'data' : [],
			'status' : 200
		};

		// Return the correct collection
		if(collectionId in storage.collections) {
			answer.data = storage.collections[collectionId];
		}
		else {
			answer.status = 404;
		}

		if(typeof(callback) === 'function') {
			callback(answer);
		}
	};

	// Creates a new, clean, local storage
	this.clean = function() {
		localStorage.setItem(localStorageName, JSON.stringify({'collections' : {}}));
	};

}).extend(minimajs.BaseDriver);
