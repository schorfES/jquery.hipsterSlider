module.exports = function(grunt) {

	// Project configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner:	'/*! <%= pkg.title %> <%= pkg.version %>\n'+
						'/*  <%= pkg.repository.url %> */\n'
			},
			build: {
				src: 'versions/<%= pkg.name %>.<%= pkg.version %>.js',
				dest: 'versions/<%= pkg.name %>.<%= pkg.version %>.min.js'
			}
		},
		jshint: {
			all: ['Gruntfile.js', '<%= pkg.name %>.js'],
			options: {
				'boss': true,
				'curly': true,
				'eqeqeq': true,
				'eqnull': true,
				'expr': true,
				'globals': {
					'module': true,
					'jQuery': true,
					'$': true,
					'window': true,
					'document': true
				},
				'immed': true,
				'noarg': true,
				'onevar': true,
				'quotmark': 'single',
				'smarttabs': true,
				'trailing': true,
				'undef': true,
				'unused': true
			}
		},
		copy: {
			main: {
				files: [
					{
						src: ['<%= pkg.name %>.js'],
						dest: 'versions/<%= pkg.name %>.<%= pkg.version %>.js'
					}
				]
			}
		}
	});

	// Load tasks
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-copy');

	// Tasks
	grunt.registerTask('default', ['validate', 'build']);
	grunt.registerTask('validate', ['jshint']);
	grunt.registerTask('build', ['copy', 'uglify']);
};