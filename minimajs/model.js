minimajs.BaseModel = (function() {

	// Model values
	this.values = {};

	// Values on server
	this.serverValues = {};

	// Random string ID
	this.identifier = 'i' + (new Date()).getTime() + Math.floor(Math.random()*1e10);

	this.revision = 0;

	/* What kind of change that has been done but not confirmed by server
		0 - No local change
		1 - Created
		2 - Value has changed
		3 - Removed */
	this.change = 1;

	// Sets default attributes to the model
	// If the attribute is specified in options then
	// it will be taken, else the default values is chosen
	this.defaults = function(defaults, options) {
		for(var key in defaults) {
			var value = defaults[key];
			if(typeof(options) === 'object' && key in options) {
				value = options[key];
			}
			this.values[key] = value;
		}
		this.serverValues = minimajs.clone(this.values);
	};

	// Returns the value for a given key
	this.get = function(key) {
		if(key in this.values) {
			return this.values[key];
		}
		else {
			minimajs.debug('Warning: Could not get ' + key + ' from  ', this.values);
			return false;
		}
	};

	// Sets the value for a given key
	this.set = function(key, value, options) {
		if(this.tran === true) {
			return;
		}
		if(key in this.values) {
			this.values[key] = value;
			this.change = 2; // Local edit
			if(!options || options.silent !== true) {
				this.distribute('change');
			}
		}
		else {
			minimajs.debug('Warning: Not setting ' + key + ' in ', this.values);
			return false;
		}
	};

	this.tran = false;

	// Destructor
	this.destroy = function(options) {
		if(this.tran === true) {
			return;
		}
		else {
			this.change = 3; // Removed
			if(!options || options.silent !== true) {
				this.distribute('destroy');
			}
		}
	};

	return this;

}).extend(minimajs.Observe);
