/**
 *
 * JS Functions
 * COFG
 *
 * Dev: Emmanuel Balpe - Batura Mobile France
 * Dev: Koldo Calvo - Batura Mobile Solutions
 * Update: 06/06/2011
 *
 */

/**
 *
 * Initialize a map to display markers.
 * It uses minCoordinates and maxCoordinates of all markers to specify
 * the correct zoom and center of the map.
 *
 *
 * @param canvas_id -> where to display the map
 * @param minLat -> of all markers
 * @param maxLat -> of all markers
 * @param minLng -> of all markers
 * @param maxLng -> of all markers
 *
 */
function initialize(canvas_id) {
  setMapHeight($("body").pagecontainer("getActivePage"), canvas_id);

  var myOptions = {
    zoom: 16,
    center: new google.maps.LatLng(global_userLat, global_userLng),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };

  // We create the map as GLOBAL and send it into map_canvas
  map = new google.maps.Map(document.getElementById(canvas_id), myOptions);

  // Hide loading message when recenter or removing the map
  google.maps.event.addListener(map, "idle", function () {
    if (canvas_id != "nexttomemap_canvas") hideLoading();
  });

  fetchPharmacies().then((pharmaciesList) => {
    setPharmaciesInMap(pharmaciesList);
  });

  // if (canvas_id == "nexttomemap_canvas")
  //   google.maps.event.addListener(map, "bounds_changed", actualize);

  // We add the markers to the map
  if (global_markers.length > 0) setMarkers(map, global_markers);

  //fitMapBoundsWithMarkers(global_markers);

  google.maps.event.trigger(map, "resize");
}

function setMapHeight($page, canvas_id) {
  var windowHeight = $(document).height();
  var headerHeight = $page.find("div:jqmData(role='header')").outerHeight(true);
  var footerHeight = $page.find("div:jqmData(role='footer')").outerHeight(true);
  $("#" + canvas_id).height(windowHeight - headerHeight - footerHeight);
}

function actualize() {
  global_map_center_Lat = map.getCenter().lat();
  global_map_center_Lng = map.getCenter().lng();

  if (global_geosuccess_before == true) {
    if (!global_fetching_pharmacies) {
      global_fetching_pharmacies = true;
      fetchPharmacies().then(
        function (pharmacies) {
          global_fetching_pharmacies = false;
          if (pharmacies.length > 0) {
            setPharmaciesInMap(pharmacies);
            addPharmaciesToGlobalPharmaciesList(pharmacies);
          }
        },
        function () {
          global_fetching_pharmacies = false;
        }
      );
    }
  }
}

/**
 *
 * Data for the markers consisting of a name, a LatLng and a zIndex for
 * the order in which these markers should display on top of each
 * other.
 *
 * @param map: the map element already created
 * @param markers: array with all the info to locate and build the markers/info bubble
 *
 */
function setMarkers(map, markers) {
  // Add markers to the map

  // Marker sizes are expressed as a Size of X,Y
  // where the origin of the image (0,0) is located
  // in the top left of the image.

  // Origins, anchor positions and coordinates of the marker
  // increase in the X direction to the right and in
  // the Y direction down.

  // Pharmacy opened
  var pharmacy_open = new google.maps.MarkerImage(
    "images/open_marker.png",
    // This marker is 20 pixels wide by 32 pixels tall.
    new google.maps.Size(55, 55),
    // The origin for this image is 0,0.
    new google.maps.Point(0, 0),
    // The anchor for this image is the base of the flagpole at 0,32.
    new google.maps.Point(27, 55)
  );

  // Pharmacy closed
  var pharmacy_close = new google.maps.MarkerImage(
    "images/close_marker.png",
    new google.maps.Size(55, 55),
    new google.maps.Point(0, 0),
    new google.maps.Point(27, 55)
  );

  // COFG
  var cofg = new google.maps.MarkerImage(
    "images/mapcofg.png",
    new google.maps.Size(55, 55),
    new google.maps.Point(0, 0),
    new google.maps.Point(27, 55)
  );

  // Batura
  var batura = new google.maps.MarkerImage(
    "images/mapbatura.png",
    new google.maps.Size(55, 55),
    new google.maps.Point(0, 0),
    new google.maps.Point(27, 55)
  );

  // User
  var user = new google.maps.MarkerImage(
    "images/mapuser.png",
    new google.maps.Size(55, 55),
    new google.maps.Point(0, 0),
    new google.maps.Point(27, 55)
  );

  // Shadow
  var shadow = new google.maps.MarkerImage(
    "images/mapshadow.png",
    // The shadow image is larger in the horizontal dimension
    // while the position and offset are the same as for the main image.
    new google.maps.Size(83, 55),
    new google.maps.Point(0, 0),
    new google.maps.Point(33, 55)
  );

  // Shapes define the clickable region of the icon.
  // The type defines an HTML <area> element 'poly' which
  // traces out a polygon as a series of X,Y points. The final
  // coordinate closes the poly by connecting to the first
  // coordinate.
  /*var shape = {
		coord: [1, 1, 1, 50, 50, 50, 50, 1, 1,1],
		type: 'poly'
	};*/

  // We create the infoWindow here in order to use the same object for each marker
  var infoWindow = new google.maps.InfoWindow();

  for (var i = 0; i < markers.length; i++) {
    var marker = markers[i];
    // Content of the infoWindow is defined here.
    var contentString = '<div class="bubble-info"><b>' + marker[0] + "</b>";

    var myLatLng = new google.maps.LatLng(marker[3], marker[4]);
    var icon;
    if (marker[5] == "O") {
      icon = pharmacy_open;
    } else if (marker[5] == "C") {
      icon = pharmacy_close;
    } else if (marker[5] == "V") {
      icon = pharmacy_close;
      contentString += "<span>(" + lang["closedForHolidays"] + ")</span>";
    } else if (marker[5] == "E") {
      icon = cofg;
    } else if (marker[5] == "B") {
      icon = batura;
    }
    contentString +=
      "<span>" + marker[1] + "</span><span>" + marker[2] + "</span></div>";
    if (marker[5] == "U") {
      global_userMarker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        shadow: shadow,
        //shape: shape,
        icon: user,
        title: marker[0],
      });
      bindInfoWindow(global_userMarker, map, infoWindow, contentString);
    } else {
      var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        shadow: shadow,
        //shape: shape,
        icon: icon,
        title: marker[0],
      });
      bindInfoWindow(marker, map, infoWindow, contentString);
      if (global_openBubleInfo == true) {
        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);
      }
    }
  }
}

function fitMapBoundsWithMarkers(markers) {
  if (markers.length > 0) {
    // Define bottom left and top right limits to prepare the boundary element of the map
    var array_coordsBounds = get_minmaxCoords(markers);
    botLeft = new google.maps.LatLng(
      array_coordsBounds[0],
      array_coordsBounds[1]
    );
    topRight = new google.maps.LatLng(
      array_coordsBounds[2],
      array_coordsBounds[3]
    );
    bounds = new google.maps.LatLngBounds(botLeft, topRight);

    // Center and zoom the map to the correct fit
    map.fitBounds(bounds);
  }
}

/**
 *
 * Function that allow users to click on another marker when a first
 * one is already open. It manages the close of the first one and the
 * opening of the new one.
 *
 * @param marker
 * @param map
 * @param infoWindow
 * @param html
 *
 */
function bindInfoWindow(marker, map, infoWindow, html) {
  google.maps.event.addListener(marker, "click", function () {
    infoWindow.setContent(html);
    infoWindow.open(map, marker);
  });
}

/**
 * function that updates the user marker position
 */
function updateUserMarker(lat, lng) {
  var newLatLng = new google.maps.LatLng(lat, lng);
  if (global_userMarker != undefined) {
    global_userMarker.setPosition(newLatLng);
  }
}

/**
 * Function that adds a list of procesed pharmacies to the map
 */
function addPharmaciesToGlobalPharmaciesList(pharmacies) {
  global_pharmacies_in_map = _.union(global_pharmacies_in_map, pharmacies);
}

/**
 * Sets pharmacies in map
 */
function setPharmaciesInMap(pharmacies) {
  $.each(pharmacies, function (i, item) {
    var address;
    address = item.address_num;
    global_markers[i] = [
      item.name,
      item.location,
      address,
      item.gps_coordx,
      item.gps_coordy,
      item.status,
    ];
  });
  setMarkers(map, global_markers);
}

/**
 * Handles the error when fetching pharmacies
 */
function fetchPharmaciesErrorHandler(msg) {
  if (global_geosuccess_before == false) {
    $("#nexttomemap_canvas").html(
      '<p class="error_txt">' + lang["ajaxerror"] + "</p>"
    );
  } else {
    navigator.notification.alert(lang["ajaxerror"], null, lang["error"]);
  }
}

/**
 * Updates the list of pharmacies based on new location data
 */
function fetchPharmacies() {
  var deferred = Q.defer();
  var dbManager = cof.service.DataBaseManager.sharedInstance();
  if (cof.service.NetworkManager.sharedInstance().isConnectedToInternet()) {
    showLoading();
    var exclude = false;
    var pharmaciesToExlude = "";
    if (global_pharmacies_in_map.length > 0) {
      exclude = true;
      pharmaciesToExlude = _.pluck(global_pharmacies_in_map, "id");
    }
    if (dbManager.isDBOpen()) {
      global_deferred_DB_opening.promise.then(
        function () {
          dbManager
            .getAnnotationsFarmaciasNearXY(
              global_map_center_Lat,
              global_map_center_Lng,
              0.01,
              0.01,
              exclude,
              pharmaciesToExlude,
              20
            )
            .then(
              function (pharmacies) {
                if (pharmacies.length > 0) {
                  getPharmacyStatusRequest(pharmacies);
                } else {
                  hideLoading();
                  deferred.resolve([]);
                }
              },
              function (error) {
                hideLoading();
                deferred.reject();
              }
            );
        },
        function () {
          getNexttomeRequest(pharmaciesToExlude);
        }
      );
    } else {
      // only map
      if (window.location.hash == "") {
        getNexttomeRequest(pharmaciesToExlude);
      }
    }
  } else {
    deferred.reject();
  }

  return deferred.promise;

  function getPharmacyStatusRequest(pharmacies) {
    var pharmacyIDs = _.pluck(pharmacies, "id");
    var data = "op=getPharmaciesState&ids=" + String(pharmacyIDs);
    $.ajax({
      type: "POST",
      url: WS_URL,
      data: data,
      dataType: "json",
      success: function (pharmacyStatuses) {
        for (var i = 0; i < pharmacyStatuses.length; i++) {
          pharmacies[i].status = pharmacyStatuses[i].status;
        }
        deferred.resolve(pharmacies);
      },
      error: function (error) {
        deferred.reject();
      },
      complete: function () {
        hideLoading();
      },
    });
  }

  function getNexttomeRequest(pharmaciesToExlude) {
    var data = {
      op: "getAllPharmacies",
      tok: sessionStorage.getItem("userToken"),
    };

    $.ajax({
      type: "GET",
      url: WS_URL,
      data: data,
      dataType: "json",
      success: function (json) {
        if (json) {
          deferred.resolve(
            $.map(json, function (item) {
              if (_.contains(pharmaciesToExlude, item.id)) return null;
              return item;
            })
          );
        } else {
          deferred.reject();
        }
      },
      error: function (error) {
        console.log(error);
        deferred.reject();
      },
      complete: function () {
        hideLoading();
      },
    });
  }
}

/**
 * function that initializes the map
 * @param canvas_id -> It is the element where the map will be initialized
 * @param op -> 0:no-user-geolocation ; 1:geo_success ; 2:geo_error
 */
function geo_location_map(op) {
  if (typeof google == "undefined" || typeof google.maps == "undefined") {
    if (cof.service.NetworkManager.sharedInstance().isConnectedToInternet()) {
      document.write(
        '<script type="text/javascript" src="https://maps.google.com/maps/api/js?key=AIzaSyCpyO-kYrtL7UnPUOna7IOJycJp-qKQjX0&v=3&region=SP"></script>'
      );
    } else {
      // Inform user that we are not able to obtain his geolocation
      $("#nexttomemap_canvas").html(
        '<p class="error_txt">' + lang["no_connection"] + "</p>"
      );
      op = -1;
      hideLoading();
    }
  }
  var canvas_id = $("body").jqmData("map_canvas");
  var $active_page = $("body").pagecontainer("getActivePage");
  switch (op) {
    case 0:
      if (canvas_id == "nexttomemap_canvas") {
        // Inform user that his device don't support geolocation
        $("#nexttomemap_canvas").html(
          '<p class="error_txt">' + lang["nogeo"] + "</p>"
        );
      } else if (canvas_id == "pharmacymap_canvas") {
        initialize(canvas_id);
      }
      hideLoading();
      break;
    case 1:
      if (canvas_id == "nexttomemap_canvas") {
        // check if we have obtained user geolocation before
        if (global_geosuccess_before == false) {
          global_map_center_Lat = global_userLat;
          global_map_center_Lng = global_userLng;
          global_markers.length = 0;
          var canvas_id = $("body").jqmData("map_canvas");
          global_markers[0] = [
            lang["yourpos"],
            "",
            "",
            global_userLat,
            global_userLng,
            "U",
          ];
          hideLoading();
          initialize(canvas_id);
          global_markers.length = 0;
        } else {
          updateUserMarker(global_userLat, global_userLng);
        }
      } else if (canvas_id == "pharmacymap_canvas") {
        // check if we have obtained user geolocation before
        if (global_geosuccess_before == false) {
          // initialize map with pharmacy and user markers
          global_markers[global_markers.length] = [
            lang["yourpos"],
            "",
            "",
            global_userLat,
            global_userLng,
            "U",
          ];
          initialize(canvas_id);
          centerMapFromMarker(global_markers[0]);
          hideLoading();
        } else {
          updateUserMarker(global_userLat, global_userLng);
        }
      }
      global_geosuccess_before = true;
      break;
    case 2:
      if (canvas_id == "nexttomemap_canvas") {
        // check if we have obtained user geolocation before
        if (global_geosuccess_before == false) {
          // Inform user that we are not able to obtain his geolocation
          $("#nexttomemap_canvas").html(
            '<p class="error_txt">' + lang["geoerror"] + "</p>"
          );
          hideLoading();
        }
      } else if (canvas_id == "pharmacymap_canvas") {
        if (global_geosuccess_before == false) {
          // initialize map with only pharmacy marker
          initialize(canvas_id);
          centerMapFromMarker(global_markers[0]);
          hideLoading();
        }
      }
      break;
  }
}

function centerMapFromMarker(marker) {
  if (marker && marker[3] && marker[3])
    map.setCenter(new google.maps.LatLng(marker[3], marker[4]));
}

/**
 * function that obtains the minimum and maximum values of latitude and longitude coords
 * @param m -> array of markers: [minLat,minLng,maxLat,maxLng]
 */
function get_minmaxCoords(markers) {
  var array_coords = [];
  var arrayLat = [];
  var arrayLng = [];
  // obtain the lat and lng coords from all markers
  for (var i = 0, len = markers.length; i < len; i++) {
    arrayLat[i] = markers[i][3];
    arrayLng[i] = markers[i][4];
  }
  // sort the coords asc
  arrayLat.sort(sortNumber);
  arrayLng.sort(sortNumber);
  // obtain the min/max lat/lng coords
  array_coords = [
    arrayLat[0],
    arrayLng[0],
    arrayLat[arrayLat.length - 1],
    arrayLng[arrayLng.length - 1],
  ];

  return array_coords;
}

/**
 *
 * function that sorts asc an array of numbers
 *
 * usage: variable_array.sort(sortNumber)
 *
 */
function sortNumber(a, b) {
  return a - b;
}
