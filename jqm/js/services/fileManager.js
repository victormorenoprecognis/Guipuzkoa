var cof = window.cof || {};
cof.service = cof.service || {};
cof.service.FileManager = (function () {
  'use strict';
   var instance;

  var dbName = 'farmacias';
  var fileSystemURL;
  var databasePath = null;

  var getNativeURL = function(){
  	  	var deferred = Q.defer();
  	  	if (typeof fileSystemURL == "undefined") {
  			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
    		  	fileSystemURL=fileSystem.root.nativeURL;
    		  	deferred.resolve(fileSystemURL);
  			}, function(error){
  				console.log(error);
  			});
  	  	} else {
    		  deferred.resolve(fileSystemURL);
  	  	};

   		return deferred.promise;
  };

  var dbPath = function() {
    var deferred = Q.defer();
    if (databasePath!=null) {
      deferred.resolve(databasePath);
    } else {
      if (deviceType()=="Android") {
        databasePath = cordova.file.applicationStorageDirectory+"databases/farmacias.db";
        deferred.resolve(databasePath);
      } else {
        getNativeURL().then(function(fileSystemURL) {
          databasePath = fileSystemURL+"database/farmacias.db";
          deferred.resolve(databasePath);
        });
      };
    };
    return deferred.promise;
  };

  var existsDB = function() {
    var deferred = Q.defer();
    dbPath().then(function(path){
      $.ajax({
        url:path,
        type:'HEAD',
        error: function() {
          deferred.resolve(false);
        },
        success: function() {
          deferred.resolve(true);  
        }
      });
    });
    return deferred.promise;
  };

  function FileManager() {
  	console.log('File Manager Instantiation');

    return { 
    		getDocumentsFolder : getNativeURL,
        getDBPath : dbPath,
        existsDB : existsDB
	   };
  };
  
  return {
        sharedInstance: function() {
            if (!instance) {
                instance = FileManager();
            }
            return instance;
        }
  };
}());