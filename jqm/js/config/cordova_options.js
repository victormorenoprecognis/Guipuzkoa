/******************************************************
 * CORDOVA
 */

function onDeviceReady() {
  var networkManager = cof.service.NetworkManager.sharedInstance();
  var dbManager = cof.service.DataBaseManager.sharedInstance();
  var fileManager = cof.service.FileManager.sharedInstance();

  // Register the event listener
  document.addEventListener("backbutton", onBackKeyDown, false);

  window.open = cordova.InAppBrowser.open;

  //setTimeout(function() {
  navigator.splashscreen.hide();
  //}, 2000);

  if (!networkManager.isConnectedToInternet()) {
    fileManager.existsDB().then(function (exists) {
      if (exists) {
        dbManager.openDB();
        global_deferred_DB_opening.resolve();
        showAlert(lang["no_connection"], lang["Information"]);
      } else {
        showAlert(lang["error_msg"], lang["Information"]);
        // fix map height to window
        var $active_page = $("body").pagecontainer("getActivePage");
        if ($(".page_map") === $active_page) {
          setContentHeight($active_page);
          setMapHeight(
            $("body").pagecontainer("getActivePage"),
            $("body").jqmData("map_canvas")
          );
        }
      }
    });
  } else {
    fileManager.existsDB().then(function (exists) {
      networkManager.getCreationTimeDDBB().then(function (timestamp) {
        if (!exists || dbManager.checkUpdateDDBB(timestamp)) {
          var r = navigator.notification.confirm(
            lang["update_ddbb"],
            function (index) {
              if (index == 1) {
                networkManager.downloadDB().then(function (db) {
                  if (db["isFile"] == true) {
                    if (timestamp != null) {
                      setValue("lastUpdate", timestamp);
                    }
                    dbManager.openDB();
                    global_deferred_DB_opening.resolve();
                    showAlert(lang["ddbb_installed"], lang["Information"]);
                  } else {
                    showAlert(lang["error_msg"], lang["Information"]);
                  }
                  // fix map height to window
                  var $active_page = $("body").pagecontainer("getActivePage");
                  if ($(".page_map") === $active_page) {
                    setContentHeight($active_page);
                    setMapHeight(
                      $("body").pagecontainer("getActivePage"),
                      $("body").jqmData("map_canvas")
                    );
                  }
                });
              }
            },
            lang["confirm"],
            [lang["ok"], lang["cancel"]]
          );
        } else {
          dbManager.openDB();
          global_deferred_DB_opening.resolve();
        }
      });
    });
  }
}

function onBackKeyDown() {
  if ($(".ui-popup-active")[0]) {
    $(".ui-popup").popup("close");
    return false;
  } else if ($.mobile.activePage.is(".exit-app")) {
    navigator.notification.confirm(
      lang["exit_msg"], // message
      onConfirm, // callback to invoke with index of button pressed
      lang["exit_title"], // title
      [lang["exit_ok"], lang["exit_cancel"]] // buttonLabels
    );
    return false;
  } else {
    navigator.app.backHistory();
    return false;
  }
}

function onConfirm(index) {
  if (index === 1) {
    navigator.app.exitApp();
  }
}

function showAlert(alertText, title) {
  if (isCordovaApp)
    navigator.notification.alert(
      alertText,
      null,
      title ? title : lang["attention"]
    );
  else alert(alertText);
}
