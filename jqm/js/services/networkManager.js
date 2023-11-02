var cof = window.cof || {};
cof.service = cof.service || {};
cof.service.NetworkManager = (function () {
  "use strict";
  var instance;

  var URL_DDBBUPDATE = "https://m.cofgipuzkoa.com/ddbb/";
  var APIdbPath = URL_DDBBUPDATE + "farmacias.db";
  var dbUpdateTimestamp = "ddbb_update_time.php";
  var fileManager = cof.service.FileManager.sharedInstance();

  function checkConnection() {
    if (
      typeof navigator.connection != "undefined" &&
      typeof Connection != "undefined"
    ) {
      var networkState = navigator.connection.type;
      return (
        networkState != Connection.NONE && networkState != Connection.UNKNOWN
      );
    } else {
      //If navigator.connection.type is not loaded the user is using the browser
      return true;
    }
  }

  function getCreationTimeDDBB() {
    console.log(
      "*** getCreationTimeDDBB " + URL_DDBBUPDATE + dbUpdateTimestamp
    );
    var deferred = Q.defer();
    $.ajax({
      url: "https://m.cofgipuzkoa.com/ddbb/ddbb_update_time.php", //URL_DDBBUPDATE+dbUpdateTimestamp,
      dataType: "text",
      success: function (timestamp) {
        console.log("*** getCreationTimeDDBB success: " + timestamp);
        deferred.resolve(timestamp);
      },
      error: function (error) {
        var errorOutput = JSON.stringify(error, null, 4); // (Optional) beautiful indented output.
        console.log("*** getCreationTimeDDBB error: " + errorOutput);
        deferred.resolve(null);
      },
    });
    return deferred.promise;
  }

  /**
   * Gets the state of the pharmacies that are passed as params
   * @param id of the pharmacy
   */
  function getPharmaciesState(id) {
    var deferred = Q.defer();
    var data = {
      op: "getPharmaciesState",
      ids: id,
    };

    $.ajax({
      type: "POST",
      url: WS_URL,
      data: data,
      dataType: "json",
      success: function (json) {
        deferred.resolve(json);
      },
      error: function (error) {
        deferred.resolve(null);
      },
    });
    return deferred.promise;
  }

  function NetworkManager() {
    console.log("Network Manager Instantiation");
    return {
      downloadDB: function () {
        var deferred = Q.defer();
        var uri = encodeURI(APIdbPath);
        fileManager.getDBPath().then(function (dbPath) {
          var fileTransfer = new FileTransfer();
          fileTransfer.download(
            uri,
            dbPath,
            function (entry) {
              deferred.resolve(entry);
              console.log("download complete: " + entry.toURL());
            },
            function (error) {
              deferred.resolve(null);
              console.log("download error source " + error.source);
              console.log("download error target " + error.target);
              console.log("upload error code" + error.code);
            },
            false
          );
        });
        return deferred.promise;
      },
      isConnectedToInternet: checkConnection,
      getCreationTimeDDBB: getCreationTimeDDBB,
      getPharmaciesState: getPharmaciesState,
    };
  }

  return {
    sharedInstance: function () {
      if (!instance) {
        instance = NetworkManager();
      }
      return instance;
    },
  };
})();
