module.exports = function (grunt) {
  var packageJson = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: packageJson,
    uglify: {
      options: {
        sourceMap: true,
        sourceMapName: 'dist/simple-tracker.min.map',
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> | MIT\n' +
                  ' * https://github.com/codeniko/simple-tracker */'
      },
      main: {
        files: [{
          src: 'index.js',
          dest: 'dist/simple-tracker.min.js'
        }]
      },
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);
};
