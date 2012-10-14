// Dummy base class that exists so that comparations can be done
// independent on what kind of driver that is used
minimajs.BaseDriver = function() {
	this.init = function() {};
	this.start = function() {};
	this.ready = function(callback) {
		callback();
	};
};
