// Extend a class with the given base-class
// Only supports a single inheritance per level
Function.prototype.extend = function(Base) {
	// Is the base-class valid?
	if(typeof(Base) !== 'function') {
		minimajs.debug("Baseclass unknown, will not inherit from ", Base);
		return this;
	}

	// Create an instance of current version of class
	var instance = new this();

	// Classical prototype based inheritance from Base
	this.prototype = new Base();
	this.prototype.constructor = this;

	// Store Base and child instance in class for later
	this.prototype.Base = Base;
	this.prototype.childInstance = instance;

	// Ugly hack to add modules property to application class definition
	if(this.isExtending(minimajs.BaseApp)) {
		this.modules = {};
	}

	return this;
};

// Checks if the object inherits from given argument
Function.prototype.isExtending = function(Base) {
	return (typeof(this.prototype.Base) === 'function' && this.prototype.Base === Base);
};

// Must be run with the instance as argument after
// a class that uses inheritance has been instantiated 
minimajs.inherit = function(self) {

	// The instance does not inherit from any parent
	if(self.Base === undefined) {
		return;
	}

	// Create a unique instance of the parent for this instance
	// so that no object sharing is present between the children
	var b = new self.Base();

	// If multi-level inheritance is used, recursively apply this to the parent
	minimajs.inherit(b);

	// Store _super as a reference to the parent
	self._super = b;

	// Copy all the parent's properties to the child if
	// it is not already defined in the child
	for(var key in b) {
		if(!(key in self.childInstance)) {
			self[key] = b[key]; // Call be reference if object
		}
	}

};
