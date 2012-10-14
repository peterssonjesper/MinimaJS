// TBD: Depends on how driver is returning data, should not be the case
minimajs.BaseCollection = (function() {

	// The model-objects associated with the collection
	var models = [];
	var removedModels = [];

	// Destroys current models
	var destroyModels = function() {
		var i;
		for(i in models) {
			models[i].destroy();
		}
		for(i in removedModels) {
			removedModels[i].destroy();
		}
		models = [];
		removedModels = [];
	};

	// Starts to observe any changes in a newly created model
	var observeModel = function(m) {
		var self = this;
		this.observe(m, 'change', 'destroy', function(action, model) {
			// If the model is destroyed must it be deleted from the collection
			if(action === 'destroy') {
				for(var j in models) {
					if(models[j].identifier === model.identifier) {
						removedModels.push(models.splice(j, 1)[0]); // Move from live models to dead models
						self.distribute('remove'); // Tell any observers that a model was removed
						break;
					}
				}
			}
			self.distribute(action === 'destroy' ? 'remove' : action);
		});
	};

	// Commit a change due to successful sync
	var commit = function(delta) {
		minimajs.debug("Commit " + delta.identifier + ", " + delta.change);
		var model;
		if(delta.change === 3) { // Was to be removed
			for(var i in removedModels) { // Local removal, destructor has already run
				if(removedModels[i].identifier === delta.identifier) {
					this.unobserve(removedModels[i], 'destroy');
					removedModels.splice(i, 1);
					return;
				}
			}
			for(var j in models) { // Remote removal
				if(models[j].identifier === delta.identifier) {
					this.unobserve(models[j], 'destroy');
					models[j].destroy();
					models[j].change = 0;
					models.splice(j, 1);
					this.distribute('remove');
					return;
				}
			}
		}
		else if(delta.change === 1) { // Insert
			model = this.get(delta.identifier);
			if(model === false) { // Insert model from server
				model = this.insert(delta.values, true);
				model.identifier = delta.identifier;
			}
			model.tran = false;
			model.revision = delta.revision;
			model.change = 0;
		}
		else if(delta.change === 2) { // Change
			model = this.get(delta.identifier);
			if(model === false) {
				for(var k in removedModels) {
					if(removedModels[k].identifier === delta.identifier) {
						model = removedModels[k];
						break;
					}
				}
			}
			if(model !== false) {
				model.tran = false;
				model.revision = delta.revision;
				model.change = 0;
				// TBD: Conflict may occur since local changes may be done in model.values
				model.values = minimajs.clone(delta.values);
				model.serverValues = delta.values; // New server version
				model.distribute('change'); // TBD: Should only be done on remote change
			}
		}
	};

	// Revert a change due to failure while syncing
	var revert = function(delta) {
		minimajs.debug("Revert " + delta.identifier + ", " + delta.change);
		var i, model;
		if(delta.change === 1) { // Was to be inserted, let's remove it again
			for(i in models) {
				if(models[i].identifier === delta.identifier) {
					this.unobserve(models[i], 'destroy');
					models[i].destroy();
					models[i].change = 0;
					this.distribute('remove');
					models.splice(i, 1);
					return;
				}
			}
		}
		else if(delta.change === 2) { // Was to be changed, let's set to last values
			model = this.get(delta.identifier);
			if(model !== false) { // Model might have been removed
				model.tran = false;
				model.change = 0;
				model.values = minimajs.clone(model.serverValues);
				model.distribute('change');
			}
		}
		else if(delta.change === 3) { // Was to be removed, let's insert it again
			for(i in removedModels) {
				if(removedModels[i].identifier === delta.identifier) {
					model = removedModels.splice(i, 1)[0];
					model.tran = false;
					model.change = 0;
					model.revision = delta.revision;
					models.push(model);
					this.distribute('insert');
					return;
				}
			}
		}
	};

	this.init = function() {
		var self = this;
		this.module.app.message.listen('collection', 'commit', function(delta) {
			if(delta.collectionId === self.identifier) {
				commit.call(self, delta);
			}
		});
		this.module.app.message.listen('collection', 'revert', function(delta) {
			if(delta.collectionId === self.identifier) {
				revert.call(self, delta);
			}
		});
	};

	// Fetches data from API and stores it in the collection
	this.fetch = function(callback) {

		var self = this;

		this.module.app.message.send('api', 'fetch', this.identifier, function(answer) {

			// Clear old models
			destroyModels.call(self);

			for(var i in answer.data) {
				// Create model object from API data description
				var m = self.module.factory(self.model, answer.data[i].values);
				m.identifier = answer.data[i].identifier;
				m.revision = answer.data[i].revision;
				m.change = 0; // Same as on server

				observeModel.call(self, m);
				models.push(m);
			}

			// We are done, tell that to the listeners
			if(typeof(callback) === 'function') {
				callback();
			}

		});
		return this;
	};

	// Saves the collection by sending the data to the API
	this.save = function() {
		var deltas = [];
		var i;

		// Construct deltas
		for(i in models) {
			if(models[i].change > 0 && models[i].tran !== true) { // Insert or local change
				models[i].tran = true;
				var d = {
					'identifier' : models[i].identifier,
					'change' : models[i].change,
					'collectionId' : this.identifier,
					'revision' : models[i].revision,
					'values' : minimajs.clone(models[i].values)
				};
				deltas.push(d);
			}
		}
		for(i in removedModels) {
			if(removedModels[i].tran !== true) {
				removedModels[i].tran = true;
				deltas.push({
					'identifier' : removedModels[i].identifier,
					'change' : removedModels[i].change,
					'revision' : removedModels[i].revision,
					'collectionId' : this.identifier
				});
			}
		}

		if(deltas.length > 0) {
			this.module.app.message.send('api', 'save', deltas);
		}

		return this;
	};

	// If an argument is given is the model with that ID returned
	// Else is all models returned
	this.get = function(id) {
		if(arguments.length === 1) { // OK, got ID. Let's find the model
			for(var i in models) {
				if(models[i].identifier === id) {
					return models[i];
				}
			}
			//minimajs.debug("Warning: Could not find ID " + id + " in collection " + this.identifier);
			return false; // ID not found
		}
		else {
			return models;
		}
	};

	// Inserts a model in the collection
	// The argument can either be a model or a description of it
	this.insert = function(model, returnModel) {
		var m = model;

		// If a description is given, create a model object
		if(model instanceof this.app.AppClass.modules[this.module.identifier][this.model] === false) {
			m = this.module.factory(this.model, model);
		}

		observeModel.call(this, m);
		m.change = 1;
		models.push(m);
		this.distribute('insert'); // Tell any observers that a new object was inserted

		if(arguments.length === 2 && returnModel === true) {
			return m;
		}
		return this;
	};

	// Removes a model with the given ID from the collection
	this.remove = function(id) {
		for(var i in models) {
			if(models[i].identifier === id) {
				var m = models[i];
				m.destroy(); // Run destructor on model
				break;
			}
		}
		return this;
	};

	// Sorts the collection by either specified attribute or by compare-function
	this.sort = function(/* cmp_key_1, cpm_key_2 ... */) {
		if(arguments.length === 1 && typeof(arguments[0]) === 'function') { // Sort function provided
			models.sort(arguments[0]);
		}
		else { // Sort by attribute
			var attributes = arguments;
			models.sort(function(a, b) {
				var current = 0;
				while(current < attributes.length) {
					if(a.get(attributes[current]) === b.get(attributes[current])) { // Equal, compare no next
						current++;
						continue;
					}
					return a.get(attributes[current]) > b.get(attributes[current]) ? 1 : -1;
				}
				return a.identifier.substring(1)-b.identifier.substring(1); // Everything equal, compare on ID
			});
		}
		this.distribute('sort'); // Tell any observers that the collection has been sorted
		return this;
	};

	this.set = function(key, value, options) {
		for(var i in models) {
			models[i].set(key, value, options);
		}
	};

	// Destructor
	this.destroy = function() {
		destroyModels.call(this);
	};

}).extend(minimajs.Observe);
