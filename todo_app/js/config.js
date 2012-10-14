// Select selector-engine
minimajs.config.selectorEngine = $; // Use jQuery
//minimajs.config.selectorEngine = Sizzle;

// A function taking the template as first arg and its data as second
minimajs.config.templateEngine = _.template;

// Set to true to enable debugging
minimajs.config.debug = false;

// Select what API driver to use
minimajs.config.driver = minimajs.drivers.LocalStorage;
//minimajs.config.driver = minimajs.drivers.Websocket;
//minimajs.config.driverUri = 'ws://localhost:8080';
//minimajs.config.driverProtocol = '*';
