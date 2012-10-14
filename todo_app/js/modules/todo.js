// Controller for the module
App.modules.Todo = (function() {
	var self = this;
	this.init = function() {

		// Create instances for todoItems-collection and the main presentation
		this.todoItems = self.factory('TodoItems');
		this.factory('MainPresentation');

		// Listen on the input channel and take action
		this.app.message.listen('input', 'addItem', function(label) {
			// Someone added an item
			self.todoItems.insert({'label' : label}).sort('done', 'label').save();
		});
		this.app.message.listen('input', 'clearCompleted', function() {
			// Someone tries to clear all completed items
			var items = self.todoItems.get();
			for(var i in items) {
				if(items[i].get('done') === true) {
					items[i].destroy({'silent' : true});
				}
			}
			self.todoItems.save();
		});
		this.app.message.listen('input', 'removeItem', function(todoItem) {
			// Someone removed an item
			todoItem.destroy();
			self.todoItems.save();
		});
		this.app.message.listen('input', 'toggleItem', function(todoItem, checked) {
			// Someone toggled an item
			todoItem.set('done', checked ? false : true);
			self.todoItems.save();
		});
		this.app.message.listen('input', 'setAll', function(checked) {
			// Someone clicked setall-button
			self.todoItems.set('done', checked ? false : true, {'silent' : true});
			self.todoItems.save();
		});
		this.app.message.listen('input', 'editItem', function(todoItem, label, listItemPresentation) {
			// Someone wants to edit an item
			todoItem.isEditing = false;
			todoItem.set('label', label, {'silent' : true});
			self.todoItems.save();
			listItemPresentation.compile(); // Re-render listItem view
		});
	};
}).extend(minimajs.BaseModule);

// The presentation-model that is used when viewing the list of todoItems
App.modules.Todo.MainPresentation = (function() {
	var self = this;
	this.view = '#todo-main-view'; // Selector specifying the HTML-view
	this.container = '#content'; // Selector specifying parent DOM-node

	// Listen to user input
	this.input = {
		'keyup #add input' : function(inputType, element, ev) {
			if(ev.keyCode === 13 && $(element).val().length > 0) { // Enter + Got value
				this.app.message.send('input', 'addItem', $(element).val()); // Post event on the input-channel
			}
		},
		'click #checkall' : function(inputType, element, ev) {
			this.app.message.send('input', 'setAll', $(element).hasClass('allchecked'));
		}
	};

	// Constructor
	this.init = function() {
		// Observe inserts in the collection
		this.observe(this.module.todoItems, 'insert', function(action, todoItems) {
			self.module.todoItems.sort('done', 'label'); // Sort collection after 'done'-property
		});

		// Observe remove & sort in the collection
		this.observe(this.module.todoItems, 'remove', 'sort', function(action, todoItems) {
			this.drawList(); // Redraw list of tasks
		});

		// Observe change in the collection
		this.observe(this.module.todoItems, 'change', function(action, todoItems) {
			todoItems.sort('done', 'label'); // Sort collection after 'done'-property
		});

		// Fetch data in collection from API
		this.module.todoItems.fetch(function() {
			self.module.todoItems.sort('done', 'label'); // Sort the data after fetching is complete
		});
	};

	// Draws the list of the tasks
	this.drawList = function() {
		// Data sent to the view when rendering
		this.domData = {
			todoItems : this.module.todoItems,
			left : this.module.todoItems.left // Number of done todoItems
		};

		this.html(); // Render the view in the parent container

		var todoItems = this.module.todoItems.get();
		for(var key in todoItems) {
			// Create sub-view and append it to this view
			self.factory('ListItemPresentation', todoItems[key]).append();
		}

		// Create footer and render it
		this.footerPresentation = this.footerPresentation || self.factory('FooterPresentation', this.module.todoItems);
		this.footerPresentation.html();
	};
}).extend(minimajs.BasePresentation);

// The presentation-model that is used when viewing an todoItem
App.modules.Todo.ListItemPresentation = (function() {
	this.view = '#todo-list-item'; // Selector specifying the HTML-view
	this.container = '#list'; // Selector specifying parent DOM-node
	this.domType = 'li'; // HTML-element for this view
	this.domAttributes = { // Attributes on this HTML-element
		'class' : function() {
			return (this.domData.todoItem.get('done') === true) ? 'done' : '';
		}
	};

	// Constructor
	this.init = function(todoItem) {
		this.domData = { // Data sent to the view when rendering
			'todoItem' : todoItem
		};

		// When the todoItem is destroyed, destroy this view
		this.observe(todoItem, 'destroy', this.destroy);

		// When the todoItems is changed, re-compile the view with fresh data
		this.observe(todoItem, 'change', this.compile);
	};

	// Listen to user input
	this.input = {
		'click .rm' : function(inputType, element) {
			// Someone clicked on the removed button
			this.app.message.send('input', 'removeItem', this.domData.todoItem);
		},
		'click .label' : function(inputType, element) {
			// Someone clicked on a listitem, let's replace it with an editView
			if(this.isEditing === true) { // Are we already editing the todoItem?
				return;
			}
			this.isEditing = true;
			var editPresentation = this.factory('EditListItemPresentation', this.domData.todoItem, this);
			this.observe(this.domData.todoItem, 'change', function() {
				this.isEditing = false;
				this.compile(); // Re-render
			});
		},
		'click .check' : function(inputType, element) {
			// Someone clicked on the checkbox
			this.app.message.send('input', 'toggleItem', this.domData.todoItem, $(element).hasClass('checked'));
		}
	};
}).extend(minimajs.BasePresentation);

// The presentation-model that is used when editing an todoItem
App.modules.Todo.EditListItemPresentation = (function() {
	this.view = '#todo-edit-list-item'; // Selector specifying the HTML-view

	// Constructor
	this.init = function(todoItem, listItemPresentation) {
		this.listItemPresentation = listItemPresentation;
		this.container = $(listItemPresentation.dom).find(".label")[0]; // Parent container
		this.domData = { // Data sent to view when rendering
			'todoItem' : todoItem
		};
		this.html(); // Render view in the parent container
		$(this.container).find('input').focus(); // Focus the input-element
	};
	var onblur = function(element) {
		this.app.message.send('input', 'editItem', this.domData.todoItem, $(element).val(), this.listItemPresentation);
		this.destroy();
	};
	this.input = {
		'blur input' : function(inputType, element) {
			onblur.call(this, element);
		},
		'keyup input' : function(inputType, element, ev) {
			if(ev.keyCode === 13) {
				onblur.call(this, element);
			}
		}
	};
}).extend(minimajs.BasePresentation);

// Presentation-model for the footer
App.modules.Todo.FooterPresentation = (function() {
	this.view = '#todo-footer-view'; // Selector specifying the view
	this.container = '#footer'; // Selector specifying the parent container

	this.input = {
		'click button' : function() {
			this.app.message.send('input', 'clearCompleted');
		}
	};

	// Constructor
	this.init = function(todoItems) {
		this.domData = { // Data sent to view when rendering
			'total' : function() {
				return todoItems.get().length; // Number of todoItems
			},
			left : todoItems.left // Number of done todoItems
		};
	};
}).extend(minimajs.BasePresentation);

// Collection
App.modules.Todo.TodoItems = (function() {
	// Specify what model to use for this collection
	this.model = 'TodoItem';

	// Used to identify the collection, sent to API driver on changes
	this.identifier = 'todoitems'; 

	var self = this;
	this.left = function() {
		var counter = 0;
		for(var i in self.get()) {
			counter += self.get()[i].get('done') ? 0 : 1;
		}
		return counter;
	};
}).extend(minimajs.BaseCollection);

// Model
App.modules.Todo.TodoItem = (function() {
	// Constructor
	this.init = function(options) {
		this.defaults({ // Specify default-values for the model
			label : 'Click to edit',
			done : false
		}, options);
	};
	return this;
}).extend(minimajs.BaseModel);
