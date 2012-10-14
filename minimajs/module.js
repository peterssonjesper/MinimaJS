minimajs.BaseModule = (function() {

	// Store presentations and collections that
	// belong to the module
	var presentations = [];
	var collections = [];

	// Non human-readable name of the module
	this.identifier = "";

	// Factory for creating presentations and collections that belong to the module
	this.factory = function(name /* initArgs ... */) {
		// Check if it is a part of the module
		if(name in this.app.AppClass.modules[this.identifier]) {
			var Class = this.app.AppClass.modules[this.identifier][name];
			if(!(Class.isExtending(minimajs.BaseCollection) || 
				Class.isExtending(minimajs.BaseModel) ||
				Class.isExtending(minimajs.BasePresentation))) {
				minimajs.debug('Warning: Will not create an instance of ' + name + '. I can only produce presentations, collections and models.');
				return false;
			}
			
			var instance = new this.app.AppClass.modules[this.identifier][name]();
			minimajs.inherit(instance);

			instance.module = this;
			instance.app = this.app;

			// Run init-constructor
			if(typeof(instance.init) === 'function') {
				instance.init.apply(instance, [].slice.call(arguments, 1));
			}

			// Store references so that they later can be destroyed
			if(instance instanceof minimajs.BasePresentation) {
				presentations.push(instance);
			}
			else if(instance instanceof minimajs.BaseCollection) {
				collections.push(instance);
			}

			return instance;
		}
		else {
			minimajs.debug('Warning: Will not create an instance of ' + name + ' since it cannot be found in the module.');
			return false;
		}
	};

	this.getPresentations = function() {
		return presentations;
	};

	// Destructor
	this.destroy = function() {
		var i;
		// Destroy all presentations and collections
		for(i in presentations) {
			presentations[i].destroy();
		}
		for(i in collections) {
			presentations[i].destroy();
		}
	};

}).extend(minimajs.Observe);
