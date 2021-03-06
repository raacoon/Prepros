/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */


/*jshint browser: true, node: true*/
/*global prepros,  _*/

prepros.factory("watcher", function (projectsManager, notification, config, compiler) {

    "use strict";

    var fs = require("fs"),
        watchingFiles = [],
        watchingImports = [];

    //Function to start watching file
    function startWatching(data) {

        var files = data.files;
        var imports = data.imports;

        var _files = _.pluck(files, 'input');
        var _imports = _.pluck(imports, 'path');

        _.each(watchingFiles, function (file) {

            if (!_.contains(_files, file)) {

                fs.unwatchFile(file);
                watchingFiles = _.without(watchingFiles, file);
            }
        });

        _.each(watchingImports, function (imp) {

            if (!_.contains(_imports, imp)) {

                fs.unwatchFile(imp);
                watchingImports = _.without(watchingImports, imp);
            }
        });

        var filesToWatch = _.difference(_files, watchingFiles);

        //Watch files
        _.each(filesToWatch, function (file) {

            try {

                fs.watchFile(file, { persistent: true, interval: 200}, function(){

                    var f = _.findWhere(files, {input: file});

                    if (f.config.autoCompile) {

                        //Compile File
                        compiler.compile(f.id);

                    }
                });

                watchingFiles.push(file);

            } catch (err) {

                notification.error('Error watching file.', 'An error occurred while watching file', file);
            }

        });

        var importsToWatch = _.difference(_imports, watchingImports);

        //Watch imports
        _.each(importsToWatch, function (imp) {

            try {

                fs.watchFile(imp, { persistent: true, interval: 200}, function(){

                    var im = _.findWhere(imports, {path: imp});

                    _.each(im.parents, function (parentId) {

                        var parentFile = projectsManager.getFileById(parentId);

                        if (!_.isEmpty(parentFile) && parentFile.config.autoCompile) {

                            compiler.compile(parentId);
                        }
                    });
                });

                //Push to watching list so it can be closed later
                watchingImports.push(imp);

            } catch (err) {

                notification.error('Error watching imported file', 'An error occurred while watching file', imp);

            }

        });

    }

    return{
        startWatching: startWatching
    };

});

