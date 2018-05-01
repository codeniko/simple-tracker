module.exports = function (grunt) {
  var packageJson = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: packageJson,
    uglify: {
      options: {
        sourceMap: true,
        sourceMapName: 'dist/tracker.min.map'
      },
      main: {
        files: [{
          src: 'src/tracker.js',
          dest: 'dist/tracker.min.js'
        }]
      },
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);
};
