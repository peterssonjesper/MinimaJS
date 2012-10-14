module.exports = function(grunt) {

	grunt.initConfig({
		lint : {
			todo : ['todo/js/app/**/*.js'],
			minimajs : ['minimajs/*.js', 'minimajs/drivers/*.js']
		},
		min : {
			todo : {
				'src' : [
					'libs/json2.js',
					'minimajs/app.js',
					'minimajs/extend.js',
					'minimajs/observe.js',
					'minimajs/router.js',
					'minimajs/module.js',
					'minimajs/presentation.js',
					'minimajs/model.js',
					'minimajs/collection.js',
					'minimajs/message.js',
					'minimajs/driver.js',
					'minimajs/drivers/localstorage.js',
					'minimajs/drivers/websocket.js',
					'minimajs/bind.js'
				],
				dest : 'minimajs.min.js'
			}
		}
	});

	grunt.registerTask('default', 'lint');

};
