// Global namespace for the framework
var minimajs = {};
minimajs.drivers = {};
minimajs.config = {};

minimajs.BaseApp = function() {
	// Store ref. to class def. to access modules
	this.AppClass = minimajs.BaseModule;

	// Loads a module given by name
	this.load = function(moduleName) {

		if(this.AppClass.modules[moduleName] === undefined) {
			minimajs.debug("Error: Could not find module " + moduleName);
			return false;
		}

		if(this.module instanceof this.AppClass.modules[moduleName]) {
			minimajs.debug("Warning: The module " + moduleName + " is already loaded. Will not reload.");
			return false;
		}

		if(this.module !== undefined) { // Unload existing module
			this.unload();
		}

		// Create new instance  of module
		this.module = this.factory(this.AppClass.modules[moduleName], moduleName);

		return this.module;

	};

	// Unload current module
	this.unload = function() {
		if(this.module !== '' && this.module instanceof minimajs.BaseModule) {
			minimajs.debug("Unloading current module: " + this.module.identifier);
			this.module.destroy();
			this.module = undefined;
		}
	};
	
	// Returns current module
	this.getModule = function() {
		return this.module;
	};

	// Module factory
	this.factory = function(Class, className) {

		if(typeof(Class) !== 'function') {
			minimajs.debug("Will not instantiate the class since it's actually not a class.", className);
			return;
		}

		var instance = new Class();
		minimajs.inherit(instance);

		if(instance instanceof minimajs.BaseModule) { // Module
			instance.identifier = className;
		}
		else if(instance instanceof minimajs.BaseDriver) { // Driver
			this.driver = instance;
		}
		else if(instance instanceof minimajs.BaseRouter) { // Router
			this.router = instance;
		}

		instance.app = this;

		if(typeof(instance.init) === 'function') {
			instance.init();
		}

		return instance;
	};
};

// Application factory
minimajs.factory = function(Class) {
	if(Class.isExtending(minimajs.BaseApp) === true) {
		var instance = new Class();
		minimajs.inherit(instance);
		instance.AppClass = Class;
		instance.message = new minimajs.Message();
		instance.bindings = new minimajs.Bindings();
		instance.factory(minimajs.config.driver);
		instance.init();
		return instance;
	}
	else {
		minimajs.debug("Error: I can only produce applications, the specified class is not an application.");
		return false;
	}
};

minimajs.clone = function(obj) {
	if(typeof(obj) === 'object') {
		var target = {};
		for(var i in obj) {
			if(typeof(obj[i]) === 'object') {
				target[i] = minimajs.clone(obj[i]);
			}
			else {
				target[i] = obj[i];
			}
		}
		return target;
	}
	return obj;
};

minimajs.debug = function(msg) {
	if(minimajs.config.debug === false) {
		return;
	}
	try {
		console.log(msg);
	} catch(e) {}
};
