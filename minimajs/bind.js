minimajs.Bindings = function() {
	var actions = {};

	// Usage: minimajs.Bind.bind(document, 'click', callbackFunction)
	this.bind = function(elements, type, action) {
	
		for(var e = 0; e < elements.length; e++) {
			var element = elements[e];
			if(typeof(element) === 'object' &&
				typeof(element.addEventListener) === 'function' &&
				typeof(action === 'function')) {

				actions[type] = actions[type] || [];
				actions[type].push({'el' : element, 'action' : action});
				element.addEventListener(type, action, false);
			}
			else {
				return false;
			}
		}
	};

	this.unbind = function(elements, type) {
		actions[type] = actions[type] || [];
		for(var e = 0; e < elements.length; e++) {
			for(var key in actions[type]) {
				elements[e].removeEventListener(type, actions[type][key].action, false);
				actions[type].splice(key, 1);
			}
		}
	};
};
