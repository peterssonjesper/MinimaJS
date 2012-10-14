minimajs.BaseRouter = function() {

	// Load a module by given route
	var route = function(key) {
		if(key in this.routes) {
			this.app.load(this.routes[key]);
		}
		else {
			minimajs.debug("Error: Could not find route for " + key);
		}
	};

	// Returns the current route based on the URL
	var getCurrentRoute = function() {
		var hash = document.location.hash;
		if(hash.substring(0, 1) === '#')
			hash = hash.substring(1);
		if(hash.substring(0, 1) === this.prefix)
			hash = hash.substring(1);
		if(hash.length === 0)
			hash = '/';
		return hash;
	};

	// Listed routes, can be overridden
	this.routes = {};

	// The prefix used before the actual route, can be overriden
	this.prefix = '!';

	// Starts the router
	this.start = function(fixedRoute) {
		var currentRoute;
		if(fixedRoute !== undefined) {
			currentRoute = fixedRoute;
		}
		else {
			currentRoute = getCurrentRoute.call(this);
		}
		route.call(this, currentRoute);
	};

	// On hash-change, take action
	// TBD: Support IE
	window.onhashchange = function() {
		var currentRoute = getCurrentRoute.call(self.app.router);
		route.call(app.router, currentRoute);
	};
};
