var app;

module("Todo", {
	setup : function() {
		app = minimajs.factory(App);
		app.driver.start(function() {
			app.router.start('/');
		});

	},
	teardown : function() {
		app.unload();
	}
});

test("Add todoItem", function() {
	var length = app.getModule().todoItems.get().length;
	app.message.send('input', 'addItem');
	equal(app.getModule().todoItems.get().length, length+1);
});

test("Read todoItem", function() {
	app.message.send('input', 'addItem');
	var label = app.getModule().todoItems.get()[0].get('label');
	ok(label !== undefined);
});

test("Remove todoItem", function() {
	app.message.send('input', 'addItem');
	var length = app.getModule().todoItems.get().length;
	app.message.send('input', 'removeItem', app.getModule().todoItems.get()[0]);
	equal(app.getModule().todoItems.get().length, length-1);
});

test("Toggle item", function() {
	app.message.send('input', 'addItem');
	var item = app.getModule().todoItems.get()[0];
	var prevDone = item.get('done');
	app.message.send('input', 'toggleItem', item, !prevDone);
	var done = item.get('done');
	equal(done, prevDone);
});

test("Toggle all", function() {
	app.message.send('input', 'addItem');
	app.message.send('input', 'setAll');
	var items = app.getModule().todoItems.get();
	expect(items.length);
	for(var i in items) {
		equal(items[i].get('done'), true);
	}
});

test("Clear all completed", function() {
	app.message.send('input', 'addItem');
	app.message.send('input', 'setAll');
	app.message.send('input', 'clearCompleted');
	var length = app.getModule().todoItems.get().length;
	equal(length, 0);
});

test("Edit label", function() {
	app.driver.clean();
	app.message.send('input', 'addItem');
	var mainPresentation = app.getModule().getPresentations()[0];
	var listItemPresentation = mainPresentation.getPresentations()[1];
	listItemPresentation.input['click .label'].call(listItemPresentation);
	app.message.send('input', 'editItem', listItemPresentation.domData.todoItem, "New value", listItemPresentation);
	var item = app.getModule().todoItems.get()[0];
	equal(item.get('label'), 'New value');
});
