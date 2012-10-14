// Implementation of the observer pattern
minimajs.Observe = function() {

	// Stores all observers that are interested in this object
	this.observers = [];

	// Distributes action to the observers
	this.distribute = function(action) {
		for(var i in this.observers) {
			if(this.observers[i].action === action) {
				this.observers[i].callback.call(this.observers[i].scope, action, this);
			}
		}
	};

	// Start to observe an object
	this.observe = function(/* obj, action 1 ... action N, callback */) {
		var self = this;

		var obj = arguments[0];
		var actions = [].slice.call(arguments, 1, arguments.length-1);
		var callback = arguments[arguments.length-1];

		if(typeof(obj) === 'object' && 'observers' in obj) {
			for(var i in actions) {
				obj.observers.push({'action' : actions[i], 'callback' : callback, 'scope' : this});
			}
		}
		else {
			minimajs.debug("Warning: The following object is not observable:", obj);
		}

		return this;
	};

	// Stop observing an object
	this.unobserve = function(/* obj, action 1 ... action N*/) {
		var obj = arguments[0];
		var actions = [].slice.call(arguments, 1, arguments.length);
		if(typeof(obj) === 'object' && 'observers' in obj) {
			for(var i in actions) {
				for(var j in obj.observers) {
					if(obj.observers[j].action === actions[i]) {
						obj.observers.splice(j, 1);
						break;
					}
				}
			}
		}
		else {
			minimajs.debug("Warning: It is not possible to stop observing the given object since it's not observable.", obj);
		}
	};

	return this;
};
