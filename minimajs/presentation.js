minimajs.BasePresentation = (function() {

	// UI input bindings
	var bindings = [];

	// Store sub-presentations so that they can be destroyed
	var presentations = [];

	// DOM properties
	this.domType = 'div';
	this.domData = {};
	this.dom = false;

	// Applies UI input bindings as specified by this.input
	this.applyInput = function() {
		var self = this;
		this.unbindInput(); // Unbind any old events
		for(var key in this.input) {

			// Read input type and element from specification
			var parts = key.split(' ');
			if(parts.length < 2) {
				minimajs.debug("Warning: skipping input '" + key + "', it seems malformed.");
				continue;
			}
			var inputType = parts[0];

			var element = key.substring(parts[0].length+1);
			var $elements = minimajs.config.selectorEngine(element, this.dom);

			// Create the action callback by using call by copy
			var action = (function(inputType, key) {
				return function(ev) {
					if(typeof(self.input[key]) === 'function') {
						// E.g. callback('click', element) on the presentation scope
						self.input[key].call(self, inputType, this, ev);
					}
					else {
						minimajs.debug('Cannot run this, does not seem to be a function: ', self.input[key]);
					}
				};
			})(inputType, key); // Call by copy

			// Store bindings so that they can be unbound
			bindings.push({'elements' : $elements, 'inputType' : inputType});

			// Bind!
			this.app.bindings.bind($elements, inputType, action);
		}
	};

	// Unbinds all current UI input bindings
	this.unbindInput = function() {
		for(var i in bindings) { // Remove bindings
			var binding = bindings[i];
			this.app.bindings.unbind(binding.elements, binding.inputType);
		}
		bindings = [];
	};

	// Presentation factory
	this.factory = function(name /* initArgs ... */) {

		// Only allow production of presentations from this module
		if(name in this.app.AppClass.modules[this.module.identifier] && 
			this.app.AppClass.modules[this.module.identifier][name].isExtending(minimajs.BasePresentation)) {

			var instance = new this.app.AppClass.modules[this.module.identifier][name]();
			minimajs.inherit(instance);

			instance.module = this.module;
			instance.app = this.app;

			// Run instance.init() with args
			if(typeof(instance.init) === 'function') {
				instance.init.apply(instance, [].slice.call(arguments, 1));
			}

			presentations.push(instance);

			return instance;
		}
		else {
			minimajs.debug('Warning: Will not create an instance of ' + name + '. I can only produce presentations from this module.');
		}
	};

	// Creates the DOM element according to the specification in this.dom*
	// Uses a template language to compile the html
	this.compile = function() {
		var self = this;

		var $container = this.container;
		if(typeof(this.container) === 'string') {
			$container = minimajs.config.selectorEngine(this.container); 
		}
		var $view = this.view;
		if(typeof(this.view) === 'string') {
			$view = minimajs.config.selectorEngine(this.view);
		}

		if($container.length === 0) {
			minimajs.debug("Error: Could find container element " + this.container + " where the view was to be drawn in.");
			return;
		}
		if($view.length === 0) {
			minimajs.debug("Error: Could find view " + this.view + ", make sure that it exists.");
			return;
		}

		// No previous dom element? Create one!
		if(this.dom === false) {
			this.dom = document.createElement(this.domType);
		}

		// Set attributes on the dom element
		for(var attribute in this.domAttributes) {
			if(typeof(this.domAttributes[attribute]) === 'function') {
				this.dom.setAttribute(attribute, this.domAttributes[attribute].call(this));
			}
			else {
				this.dom.setAttribute(attribute, this.domAttributes[attribute]);
			}
		}

		// Compile HTML string from template
		var compiled = minimajs.config.templateEngine($view[0].innerHTML, this.domData); // TBD: Underscore dependent

		this.dom.innerHTML = compiled;

		self.applyInput();
	};

	// Sets the innerHTML of the container to the compiled HTML
	this.html = function() {
		this.compile();
		var e;
		if(typeof(this.container) === 'string') {
			e = minimajs.config.selectorEngine(this.container);
			if(e.length === 0) {
				return;
			}
			e = e[0];
		}
		else {
			e = this.container;
		}

		while (e.hasChildNodes()) { // Clear content
			e.removeChild(e.lastChild);
		}
		e.appendChild(this.dom);
	};

	// Appends the compiled HTML to the container
	this.append = function() {
		this.compile();
		var e = minimajs.config.selectorEngine(this.container);
		if(e.length > 0) {
			e[0].appendChild(this.dom);
		}
	};

	this.getPresentations = function() {
		return presentations;
	};

	// Destructor
	this.destroy = function() {
		this.unbindInput();
		for(var i in presentations) { // Destroy sub presentations
			presentations[i].destroy();
		}
		presentations = [];

		// Delete DOM node
		if(this.dom instanceof HTMLElement && this.dom.parentNode instanceof HTMLElement) {
			this.dom.parentNode.removeChild(this.dom);
		}

		this.distribute('destroy');
	};

}).extend(minimajs.Observe);
