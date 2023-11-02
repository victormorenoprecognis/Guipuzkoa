/**
 * function to load main strings based on default language
 */
function loadJSONMainLanguage() {
  var str_lang = getValue("cofg_lang");
  if (!str_lang) {
    document.location.href = "index.html";
  } else {
    $.ajax({
      url: "lang/" + str_lang + ".json",
      dataType: "json",
      async: false,
    })
      .done(function (json) {
        gjson_lang = json;
        lang = json;
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        console.log(
          "fail: " + jqXHR + " : " + textStatus + " : " + errorThrown
        );
      });
  }
}
/**
 * function to set default language
 * @param lang
 */
function setLang(lang) {
  setValue("cofg_lang", lang);
  window.location.href = "cofg.html";
}
/**
 * function to add translations in pages
 * @param $page
 */
function translatePage($page) {
  $page.find(":jqmData(t)").each(function () {
    var txt = $(this).attr("data-t");
    var params = $(this).attr("data-t-params");
    if (typeof gjson_lang === "undefined") {
      document.location.href = "index.html";
    }
    var translation = gjson_lang[txt];
    if (params) {
      translation = String.format(translation, params);
    }
    $(this).html(translation);
  });
}
/**
 * function to show jquerymobile loading widget
 */
function showLoading() {
  $.mobile.loading("show");
  $("#loading-popup").removeClass("ui-screen-hidden").addClass("in");
  $(document).bind("touchmove", function (event) {
    event.preventDefault();
  });
}
/**
 * function to hide jquerymobile loading widget
 */
function hideLoading() {
  $.mobile.loading("hide");
  $("#loading-popup").removeClass("in").addClass("ui-screen-hidden");
  $(document).unbind("touchmove");
}
/**
 * Function to set map height
 * @param $page
 */
function setContentHeight($page) {
  var windowHeight = $(document).height();
  var headerHeight = $page.find("div:jqmData(role='header')").outerHeight(true);
  var footerHeight = $page.find("div:jqmData(role='footer')").outerHeight(true);
  $page
    .children("div:jqmData(role='content')")
    .height(windowHeight - headerHeight - footerHeight);
}
/**
 * Format the address for display properly.
 * @param street Name and number of the street.
 * @town Name of the town. In case of Donostia it includes de neighbourhood.
 * http://localhost/COFServer//ws/cofg_ws.php?op=getLocations
 */
formatAddress = function (street, town) {
  var address = street;
  var posDonosti = town.indexOf(" (" + lang["Donosti"] + ")");

  if (posDonosti > -1)
    return (
      street +
      " (" +
      town.substring(0, posDonosti) +
      ", " +
      lang["Donosti"] +
      ")"
    );
  else return street + " (" + town + ")";
};
var DOMAIN = "https://m.cofgipuzkoa.com";
//var WS_URL = DOMAIN+"ws/cofg_ws.php";
//"../ws/cofg_ws.php"

//var currentIP = "192.168.2.182";

// DOMAIN = "http://localhost:8082/";
// DOMAIN = "m.cofgipuzkoa.com/betaversion/";
WS_URL = DOMAIN + "/betaversion/ws/cofg_ws.php?";

// DOMAIN = "https://m.cofgipuzkoa.com/";
// WS_URL = DOMAIN + "ws/cofg_ws.php?";

var global_lang = {};
var lang = {};
var global_markers = [];
var map;
var globalUserMarker;
var global_userLat;
var global_userLng;
var global_userLat_delta = 0.01;
var global_userLng_delta = 0.01;
var global_map_center_Lat;
var global_map_center_Lng;
var global_geosuccess_before;
var global_news = [];
var global_openBubleInfo = false;
var isCordovaApp = !!window.cordova;
var global_pharmacies_in_map = [];
var global_deferred_DB_opening = Q.defer();
var global_fetching_pharmacies = false;

loadJSONMainLanguage();

/**
 * Handles the logic for the DB update
 */

function calcualtePharmacyDistance(coordX, coordY) {
  var global_userLat = localStorage.getItem("userlat");
  var global_userLng = localStorage.getItem("userLng");

  if (!global_userLat || !global_userLng) {
    return undefined;
  }

  lon1 = (global_userLng * Math.PI) / 180;
  lon2 = (coordY * Math.PI) / 180;
  lat1 = (global_userLat * Math.PI) / 180;
  lat2 = (coordX * Math.PI) / 180;

  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a =
    Math.pow(Math.sin(dlat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);

  let c = 2 * Math.asin(Math.sqrt(a));

  // Radius of earth in kilometers. Use 3956
  // for miles
  let r = 6371;

  let rr = this.formatDistance(c * r * 1000);
  return rr;
}

function formatDistance(length) {
  if (length >= 1000) {
    length = Math.round((length / 1000) * 100) / 100 + " " + "Km";
  } else {
    length = Math.round(length) + " " + "m";
  }
  return length;
}

function getAuthToken() {
  var tokenSuccess = function (authToken) {
    sessionStorage.setItem("userToken", authToken);
  };

  var tokenError = function (tokenError) {
    console.error(tokenError);
  };

  $.ajax({
    type: "POST",
    url: WS_URL,
    dataType: "json",
    data: { op: "getAuthToken" },
    success: tokenSuccess,
    error: tokenError,
    complete: function () {
      hideLoading();
    },
  });
}
