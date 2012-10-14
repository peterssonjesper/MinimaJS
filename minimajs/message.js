minimajs.Message = function() {
	var listeners = {};

	// Sends a message to a receiver
	// Both receiver and message is a string
	// Arguments are any type and are optionally specified
	this.send = function(receiver, message/*, argument1, ..., argument N*/) {
		// Find listener, let's send message
		if(receiver in listeners && message in listeners[receiver])
			for(var i in listeners[receiver][message]) {
				if(typeof(listeners[receiver][message][i]) === 'function') {
					// TBD: Scope shouldn't be undefined
					listeners[receiver][message][i].apply(undefined, [].slice.call(arguments, 2));
			}
		}
	};

	// Register a function as a listener on a given receiver and message
	// If the message is sent to the receiver is the callback fired
	this.listen = function(receiver, message, callback) {
		listeners[receiver] = listeners[receiver] || {};
		listeners[receiver][message] = listeners[receiver][message] || [];
		listeners[receiver][message].push(callback);
	};
};
