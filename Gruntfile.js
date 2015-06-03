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
				src: '<%= pkg.name %>.js',
				dest: '<%= pkg.name %>.min.js'
			}
		},

		jshint: {
			all: [
				'Gruntfile.js',
				'<%= pkg.name %>.js'
			],
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
					'document': true,
					'require': true,
					'define': true
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

		lintspaces: {
			all: {
				src: [
					'Gruntfile.js',
					'<%= pkg.name %>.js'
				],
				options: {
					newline: true,
					trailingspaces: true,
					indentation: 'tabs'
				}
			}
		},

		jscs: {
			all: [
				'Gruntfile.js',
				'<%= pkg.name %>.js'
			]
		}
	});

	// Load tasks
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-lintspaces');
	grunt.loadNpmTasks('grunt-jscs-checker');

	// Tasks
	grunt.registerTask('default', [
		'validate',
		'build'
	]);
	grunt.registerTask('validate', [
		'jshint',
		'jscs',
		'lintspaces'
	]);
	grunt.registerTask('build', [
		'uglify'
	]);
};
