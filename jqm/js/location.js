/*
 *
 * Functions in JS minimum to get the gps coordonates of the user
 *
 */
function get_location() {
  if (navigator.geolocation) {
    var wpid = navigator.geolocation.watchPosition(geo_success, geo_error, {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 15000,
    });
    $("body").jqmData("map_wpid", wpid);
  } else {
    geo_location_map(0);
  }
}

/**
 * Clears all the watch position IDs that has been initialized
 */
function clearLocationWatch() {
  navigator.geolocation.clearWatch($("body").jqmData("map_wpid"));
  $("body").jqmRemoveData("map_canvas");
  $("body").jqmRemoveData("map_wpid");
}

function geo_success(location) {
  var new_userLat = location.coords.latitude;
  var new_userLng = location.coords.longitude;

  //TODO: overrided dynamic location
  //var new_userLat = 43.236445+(Math.random() * 0.010);
  //var new_userLng = -2.146958;
  //Donosti
  //var new_userLat = 43.312102+(Math.random() * 0.010);
  //var new_userLng = -1.984612;

  if (
    new_userLat != global_userLat ||
    new_userLng != global_userLng ||
    global_geosuccess_before == false
  ) {
    global_userLat = new_userLat;
    global_userLng = new_userLng;

    localStorage.setItem("userlat", global_userLat);
    localStorage.setItem("userLng", global_userLng);

    geo_location_map(1);
  }
}

function geo_error(msg) {
  geo_location_map(2);
}
