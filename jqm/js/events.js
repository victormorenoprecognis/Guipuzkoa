/*
 * ORIENTATION AND WINDOW CHANGES
 */
$(window).resize(function (e) {
  var $active_page = $("body").pagecontainer("getActivePage");
  // fix map height to window
  if ($(".page_map") === $active_page) {
    setContentHeight($active_page);
    setMapHeight(
      $("body").pagecontainer("getActivePage"),
      $("body").jqmData("map_canvas")
    );
  }
});

$(document)
  .on("pagecontainerchange", function (event, ui) {
    $.mobile.toolbar.prototype.options.backBtnText = lang["back"];

    try {
      _gaq.push(["_setAccount", "UA-24566944-1"]);
      if ($("body").pagecontainer("getActivePage").attr("data-url")) {
        _gaq.push([
          "_trackPageview",
          $("body").pagecontainer("getActivePage").attr("data-url"),
        ]);
      } else {
        _gaq.push(["_trackPageview"]);
      }
    } catch (err) {}

    var to_page_id = ui.toPage.attr("id");

    if (typeof ui.prevPage != "undefined") {
      var from_page_id = ui.prevPage.attr("id");
      clearLocationWatch();
      $("#nexttomemap_canvas").empty();

      if (
        from_page_id == "pagenexttome_map" ||
        from_page_id == "pagepharmacy_map"
      ) {
        $("#nexttomemap_canvas").empty();
      }
    }

    if (to_page_id == "pagenexttome_map") {
      /*
       * Apartado CERCA DE MI - Map
       */
      getAuthToken();
      showLoading();
      setContentHeight($("#pagenexttome_map"));
      globalUserMarker = null;
      global_userLat = null;
      global_userLng = null;
      global_map_center_Lat = null;
      global_map_center_Lng = null;
      global_first_actualize = true;

      $("body").jqmData("map_canvas", "nexttomemap_canvas");

      global_openBubleInfo = false;
      global_fetching_pharmacies = false;
      global_geosuccess_before = false;

      var networkManager = cof.service.NetworkManager.sharedInstance();
      if (!networkManager.isConnectedToInternet()) {
        showAlert(lang["no_connection"]);
      }

      setTimeout(function () {
        get_location();
      }, 1000);
    } else if (to_page_id == "pagenexttome_list") {
      /*
       * Apartado CERCA DE MI - List
       */
      get_location();
      showLoading();

      // List the content of global_markers
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
          if (json != null) {
            $.each(json, function (i, item) {
              var address = item.address_num;

              var elem =
                '<li><a class="ntmpha_link" data-pharmacyid="' +
                item.id +
                '" data-name="' +
                item.name +
                '" data-location="' +
                item.location +
                '" data-address="' +
                address +
                '" data-tel="' +
                item.telephone +
                '" data-fax="' +
                item.fax +
                '" data-programs="' +
                item.programs +
                '" data-status="' +
                item.status +
                '" data-opening="' +
                item.opening +
                '" data-openingS="' +
                item.openingS +
                '" data-openingD="' +
                item.openingD +
                '" data-lat="' +
                item.gps_coordx +
                '" data-lng="' +
                item.gps_coordy +
                '">' +
                "<h1>" +
                item.name +
                "</h1>" +
                "<p>" +
                item.location +
                "<br/>" +
                address +
                "</p>";

              var pharmacyDistance = calcualtePharmacyDistance(
                item.gps_coordx,
                item.gps_coordy
              );

              if (pharmacyDistance != undefined) {
                elem +=
                  '<p class="ui-li-aside">' +
                  pharmacyDistance +
                  "</p>" +
                  "</a></li>";
              } else {
                elem += "</a></li>";
              }

              $("#listdynamic_ntmlist").append(elem);
            });
            // Refresh the list to see the new elements
            $("#listdynamic_ntmlist").listview("refresh");
          } else {
            $("#listdynamic_ntmlist").html(
              '<p class="error_txt">' + lang["jsonnull_map"] + "</p>"
            );
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

      if ($("#listdynamic_ntmlist").children().length == 0) {
        var success = function (json) {
          if (json != null) {
            $.each(json, function (i, item) {
              var address = item.address_num;

              var elem =
                '<li><a class="ntmpha_link" data-pharmacyid="' +
                item.id +
                '" data-name="' +
                item.name +
                '" data-location="' +
                item.location +
                '" data-address="' +
                address +
                '" data-tel="' +
                item.telephone +
                '" data-fax="' +
                item.fax +
                '" data-programs="' +
                item.programs +
                '" data-status="' +
                item.status +
                '" data-opening="' +
                item.opening +
                '" data-openingS="' +
                item.openingS +
                '" data-openingD="' +
                item.openingD +
                '" data-lat="' +
                item.gps_coordx +
                '" data-lng="' +
                item.gps_coordy +
                '">' +
                "<h1>" +
                item.name +
                "</h1>" +
                "<p>" +
                item.location +
                "<br/>" +
                address +
                "</p>";

              var pharmacyDistance = calcualtePharmacyDistance(
                item.gps_coordx,
                item.gps_coordy
              );

              if (pharmacyDistance != undefined) {
                elem +=
                  '<p class="ui-li-aside">' +
                  pharmacyDistance +
                  "</p>" +
                  "</a></li>";
              } else {
                elem += "</a></li>";
              }

              $("#listdynamic_ntmlist").append(elem);
            });
            // Refresh the list to see the new elements
            $("#listdynamic_ntmlist").listview("refresh");
          } else {
            $("#listdynamic_ntmlist").html(
              '<p class="error_txt">' + lang["jsonnull_map"] + "</p>"
            );
          }
        };

        var error = function (msg) {
          showAlert(lang["ajaxerror"], lang["error"]);
        };

        var networkManager = cof.service.NetworkManager.sharedInstance();
        if (networkManager.isConnectedToInternet()) {
          success(global_pharmacies_in_map);
        } else {
          showAlert(lang["no_connection"]);
          hideLoading();
        }
      }

      $("body").jqmRemoveData("map_wpid");
    } else if (to_page_id == "pagepharmacies_guard") {
      if ($("#pg_selectguardzone").children().length == 0) {
        showLoading();
        var success = function (json) {
          //TODO: Remove when corrected: The server is returning a 234 string before the actual content, so this is replaced
          try {
            json = $.parseJSON(json.replace("234", ""));
          } catch (e) {
            console.log(e);
          }
          if (json != null) {
            var str_html = "";
            $.each(json, function (i, item) {
              if (localStorage.getItem("selectguardzone") == item.name)
                str_html +=
                  '<option selected value="' +
                  item.idZoneGuard +
                  '">' +
                  item.name +
                  "</option>";
              else
                str_html +=
                  '<option value="' +
                  item.idZoneGuard +
                  '">' +
                  item.name +
                  "</option>";
            });

            $("#pg_selectguardzone").html(str_html);
            $("#pg_selectguardzone").selectmenu("refresh");
          } else {
            showAlert(lang["jsonnull_pha"]);
          }
        };
        var error = function () {
          showAlert(lang["ajaxerror"], lang["error"]);
        };
        var dbManager = cof.service.DataBaseManager.sharedInstance();
        var networkManager = cof.service.NetworkManager.sharedInstance();
        if (dbManager.isDBOpen()) {
          dbManager.getGuardZones().then(function (json) {
            success(json);
            hideLoading();
          });
        } else if (networkManager.isConnectedToInternet()) {
          $.ajax({
            type: "POST",
            url: WS_URL,
            dataType: "text",
            data: {
              op: "getGuardZones",
              lang: lang["lang"],
              tok: sessionStorage.getItem("userToken"),
            },
            success: success,
            error: error,
            complete: function () {
              hideLoading();
            },
          });
        } else {
          hideLoading();
          showAlert(lang["no_connection"]);
        }
      }

      /*
       * Apartado FARMACIAS - Guardia
       */
      // Set the current month

      var d = new Date();
      var cm = d.getMonth();
      var cd = d.getDate();

      $("#pg_selectmonth").selectmenu();
      $("#pg_selectmonth option").eq(cm).prop("selected", true);

      //refresh for a new selected value
      $("#pg_selectmonth").selectmenu("refresh");

      // Create day options and select the current day
      var options = "";
      var dim = daysInMonth($("#pg_selectmonth").val(), d.getFullYear());
      for (var i = 1; i <= dim; i++) {
        options += '<option value="' + i + '">' + i + "</option>";
      }
      $("#pg_selectday").empty();
      $("#pg_selectday").html(options);
      $("#pg_selectday option")
        .eq(cd - 1)
        .attr("selected", "selected");
      $("#pg_selectday").selectmenu("refresh");
    } else if (to_page_id == "pagedonosti_list") {
      /*
       * Apartado FARMACIAS - Donosti
       */

      // List all the neighborhoods of Donosti
      if ($("#listdynamic_don").children().length == 0) {
        showLoading();
        var dbManager = cof.service.DataBaseManager.sharedInstance();
        var networkManager = cof.service.NetworkManager.sharedInstance();
        var success = function (json) {
          if (json != null) {
            $.each(json, function (i, item) {
              var elem =
                '<li><a href="" class="nei_link" data-pharID="' +
                item.neighbourhoods_id +
                '" data-name="' +
                item.name +
                '">' +
                "<h1>" +
                item.name +
                "</h1>" +
                "</a></li>";
              $("#listdynamic_don").append(elem);
            });
            // Refresh the list to see the new elements
            $("#listdynamic_don").listview("refresh");
            hideLoading();
          } else {
            hideLoading();
            $("#listdynamic_don").html(
              '<p class="error_txt">' + lang["jsonnull_map"] + "</p>"
            );
          }
        };

        var error = function (msg) {
          hideLoading();
          showAlert(lang["ajaxerror"], lang["error"]);
        };
        console.log("dbManager.isDBOpen(): " + dbManager.isDBOpen());
        if (dbManager.isDBOpen()) {
          dbManager.getNeighborhoods().then(function (json) {
            success(json);
          });
        } else if (networkManager.isConnectedToInternet()) {
          $.ajax({
            type: "POST",
            url: WS_URL,
            data:
              "op=getNeighborhoods&tok=" + sessionStorage.getItem("userToken"),
            dataType: "json",
            success: success,
            error: error,
          });
        } else {
          hideLoading();
          showAlert(lang["no_connection"]);
        }
      }
      $("body").jqmRemoveData("map_wpid");
    } else if (to_page_id == "pagegipuzkoa_list") {
      /*
       * Apartado FARMACIAS - Gipuzkoa
       */

      // List all the locations
      if ($("#listdynamic_gip").children().length == 0) {
        showLoading();
        var dbManager = cof.service.DataBaseManager.sharedInstance();
        var networkManager = cof.service.NetworkManager.sharedInstance();
        var success = function (json) {
          if (json != null) {
            var beforeCharacter = "";
            $.each(json, function (i, item) {
              var elem = "";
              if (item != null) {
                if (beforeCharacter != item.name.charAt(0)) {
                  beforeCharacter = item.name.charAt(0);
                  elem +=
                    '<li data-role="list-divider" data-theme="b">' +
                    item.name.charAt(0) +
                    "</li>";
                }
              }
              elem +=
                '<li><a href="" data-townId="' +
                item.townId +
                '" class="loc_link" data-name="' +
                item.name +
                '">' +
                item.name +
                "</a></li>";

              $("#listdynamic_gip").append(elem);
            });
            // Refresh the list to see the new elements
            $("#listdynamic_gip").listview("refresh");
          } else {
            $("#listdynamic_gip").html(
              '<p class="error_txt">' + lang["jsonnull_map"] + "</p>"
            );
          }
        };

        var error = function (msg) {
          showAlert(lang["ajaxerror"], lang["error"]);
        };

        if (dbManager.isDBOpen()) {
          dbManager.getLocations().then(function (json) {
            success(json);
            hideLoading();
          });
        } else if (networkManager.isConnectedToInternet()) {
          $.ajax({
            type: "POST",
            url: WS_URL,
            data: "op=getLocations&tok=" + sessionStorage.getItem("userToken"),
            dataType: "json",
            success: success,
            error: error,
            complete: function () {
              hideLoading();
            },
          });
        } else {
          hideLoading();
          showAlert(lang["no_connection"]);
        }
      }
      $("body").jqmRemoveData("map_wpid");
    } else if (to_page_id == "pagepharmacy_info") {
      /*
       * Apartado FARMACIAS - Lista Farmacias - Info Farmacia
       */
      $("#listdynamic_p_info").listview("refresh");

      // Redirect to location list when page is reloaded by the browser
      if ($("#listdynamic_p_info > li").length == 0) {
        $.mobile.changePage("#pagepharmacies", {
          reverse: false,
          changeHash: false,
        });
      } else {
        var find = false;
        // Clear the previous selection of a pharmacy
        //$('#listdynamic_p_info li').removeClass('ui-btn-active');

        // Refresh the list to see the new elements
        //$('#listdynamic_p_info').listview('refresh');

        // Check if it is already a favorite in the cookies
        var c_fav = getValue("cofg_favorites");
        if (c_fav != undefined && c_fav != "") {
          var a_fav = c_fav.split("*");
          for (var i = 0; i < a_fav.length; i++) {
            if (a_fav[i] === $(".map_link").attr("data-pharmacyid")) {
              $("#linkfavorite").attr(
                "data-icon",
                "ui-icon-custom-icondeletefavorite"
              );
              $("#linkfavorite")
                .find(".ui-icon")
                .css(
                  "background",
                  "url(images/icondeletefavorite.png) no-repeat 50% 50%"
                );
              $("#linkfavorite")
                .removeClass("ui-icon-custom-iconaddfavorite")
                .addClass("ui-icon-custom-icondeletefavorite");
              find = true;
              break;
            }
          }
        }
        if (find == false) {
          $("#linkfavorite").attr(
            "data-icon",
            "ui-icon-custom-iconaddfavorite"
          );
          $("#linkfavorite")
            .find(".ui-icon")
            .css(
              "background",
              "url(images/iconaddfavorite.png) no-repeat 50% 50%"
            );
          $("#linkfavorite")
            .removeClass("ui-icon-custom-icondeletefavorite")
            .addClass("ui-icon-custom-iconaddfavorite");
        }

        /*
         * Create the handler for address selection:
         * when the address of a pharmacy is selected,
         * the next page (pagepharmacy_map) is filled with map
         */
        global_openBubleInfo = true;
        $(".map_link").on("click", function (event) {
          event.stopImmediatePropagation();
          event.preventDefault();

          var name = $(this).attr("data-name");
          var location = $(this).attr("data-location");
          var address = $(this).attr("data-address");
          var lat = $(this).attr("data-lat");
          var lng = $(this).attr("data-lng");
          var status = $(this).attr("data-status");

          // Check if there are set gps coords
          if (
            $(this).attr("data-lat") == "undefined" &&
            $(this).attr("data-lng") == "undefined"
          ) {
            showAlert(lang["nocoords"], lang["error"]);
          } else {
            // Set the pharmacy information as a market for map
            global_markers.length = 0;
            global_markers[0] = [
              name,
              location,
              address,
              lat,
              lng,
              status != "undefined" ? status : "E",
            ];

            var data = {
              op: "getPharmaciesState",
              ids: $(this).attr("data-pharmacyid"),
              tok: sessionStorage.getItem("userToken"),
            };

            $.ajax({
              type: "GET",
              url: WS_URL,
              data: data,
              dataType: "json",
              success: function (pharState) {
                global_markers[0][5] = pharState.status;
                $.mobile.changePage("#pagepharmacy_map");
              },
              error: function (pharError) {
                console.error(pharError);
                showAlert(lang["ajaxerror"], lang["error"]);
              },
            });
          }
          return false;
        });
      }
    } else if (to_page_id == "pagepharmacy_map") {
      /*
       * Apartado FARMACIAS - Lista Farmacias - Info Farmacia - Mapa
       */
      showLoading();
      setContentHeight($("#pagepharmacy_map"));
      global_geosuccess_before = false;
      $("body").jqmData("map_canvas", "pharmacymap_canvas");
      var networkManager = cof.service.NetworkManager.sharedInstance();
      if (!networkManager.isConnectedToInternet()) {
        showAlert(lang["no_connection"]);
      }
      get_location();
    } else if (to_page_id == "pagefavorites_list") {
      /*
       * Apartado FAVORITOS - Lista Farmacias
       */
      $("#listdynamic_favpha").empty();
      var c_fav = getValue("cofg_favorites");
      if (c_fav != undefined && c_fav != "") {
        showLoading();
        global_openBubleInfo = true;
        var dbManager = cof.service.DataBaseManager.sharedInstance();
        var networkManager = cof.service.NetworkManager.sharedInstance();
        var success = function (json) {
          if (json != null) {
            $.each(json, function (i, item) {
              var address = item.address_num;

              var elem =
                '<li><a href="" class="favpha_link" data-pharmacyid="' +
                item.id +
                '" data-name="' +
                item.name +
                '" data-location="' +
                item.location +
                '" data-address="' +
                address +
                '" data-tel="' +
                item.telephone +
                '" data-fax="' +
                item.fax +
                '" data-programs="' +
                item.programs +
                '" data-status="' +
                item.status +
                '" data-opening="' +
                item.opening +
                '" data-openingS="' +
                item.openingS +
                '" data-openingD="' +
                item.openingD +
                '" data-lat="' +
                item.gps_coordx +
                '" data-lng="' +
                item.gps_coordy +
                '">' +
                "<h1>" +
                item.name +
                "</h1>" +
                "<p>" +
                item.location +
                "<br/>" +
                address +
                "</p>";
              var pharmacyDistance = calcualtePharmacyDistance(
                item.gps_coordx,
                item.gps_coordy
              );

              if (pharmacyDistance != undefined) {
                elem +=
                  '<p class="ui-li-aside">' +
                  pharmacyDistance +
                  "</p>" +
                  "</a></li>";
              } else {
                elem += "</a></li>";
              }

              $("#listdynamic_favpha").append(elem);
            });

            // Refresh the list to see the new elements
            $("#listdynamic_favpha").listview("refresh");
          } else {
            $("#listdynamic_favpha").append(
              '<p class="error_txt">' + lang["jsonnull_pha"]
            ) + "</p>";
          }
        };
        var error = function (msg) {
          $("#listdynamic_favpha").append(
            '<p class="error_txt">' + lang["ajaxerror"]
          ) + "</p>";
        };

        if (dbManager.isDBOpen()) {
          dbManager
            .getFavorites(c_fav, global_userLat, global_userLng)
            .then(function (json) {
              var farmaciasIds = "";
              _.each(json, function (farmacia) {
                farmaciasIds += farmacia.id + "*";
              });
              setValue("cofg_favorites", farmaciasIds);
              success(json);
              hideLoading();
            });
        } else if (networkManager.isConnectedToInternet()) {
          $.ajax({
            type: "POST",
            url: WS_URL,
            data: {
              op: "getFavorites",
              lang: lang["lang"],
              arrayidPharm: c_fav,
              userLat: global_userLat,
              userLng: global_userLng,
              tok: sessionStorage.getItem("userToken"),
            },
            dataType: "json",
            success: success,
            error: error,
            complete: function () {
              hideLoading();
            },
          });
        } else {
          hideLoading();
          showAlert(lang["no_connection"]);
        }
        $("body").jqmRemoveData("map_wpid");
      } else {
        $("#listdynamic_favpha").append(
          '<p class="error_txt">' + lang["nofavorites"]
        ) + "</p>";
      }
    } else if (to_page_id == "pagemore_lastminute") {
      /*
       * Apartado MAS - Ultima hora
       */
      if ($("#lmin").children().length == 0) {
        showLoading();
        $.ajax({
          type: "POST",
          url: WS_URL,
          //data: {op:'getLastMinute', lang: lang['lang']},
          data: { op: "getNews", lang: lang["lang"] },
          dataType: "json",
          /*
           * El elemento sacado de la funcion getNews tene los siguientes atributos:
           * $fields['es'] = array("convert(VARCHAR,FechaPublicacion,112)", "Noticia", "Cuerpo", "Entrada", "TemaNoticia", "Asunto", "Fuente");
           * $fields['eu'] = array("convert(VARCHAR,FechaPublicacion,112)", "NoticiaE", "CuerpoE", "EntradaE", "TemaNoticiaE", "AsuntoE", "FuenteE");
           * $fields_json = array("FechaPublicacion", "Noticia", "Cuerpo", "Entrada", "TemaNoticia", "Asunto", "Fuente");
           */
          success: function (json) {
            if (json != null) {
              var txtnot = "";
              var id = 1;
              // Por cada noticia cargamos los datos deseados en un elemento de la lista con id="lmin".
              $.each(json, function (i, item) {
                var fecha =
                  item.FechaPublicacion.substring(6, 8) +
                  "/" +
                  item.FechaPublicacion.substring(4, 6) +
                  "/" +
                  item.FechaPublicacion.substring(0, 4);
                txtnot +=
                  '<li class="ui-btn-up-e" data-role="list-divider" data-theme="a"><span class="datetitledesc">' +
                  fecha.replace(/(\r\n|\n\r|\r|\n)/g, "<br/>") +
                  "</span>  " +
                  item.Entrada.replace(/(\r\n|\n\r|\r|\n)/g, "<br/>") +
                  "</li>";

                txtnot +=
                  '<li><a href="#" class="news_link" data-idnew="' +
                  id +
                  '"><p>' +
                  item.Noticia.replace(/(\r\n|\n\r|\r|\n)/g, "<br/>") +
                  "</p>";

                txtnot += "</a></li>";

                global_news[id] = [];
                global_news[id]["Fecha"] = fecha.replace(
                  /(\r\n|\n\r|\r|\n)/g,
                  "<br/>"
                );
                global_news[id]["Entrada"] = item.Entrada.replace(
                  /(\r\n|\n\r|\r|\n)/g,
                  "<br/>"
                );
                global_news[id]["Noticia"] = item.Noticia.replace(
                  /(\r\n|\n\r|\r|\n)/g,
                  "<br/>"
                );
                global_news[id]["Cuerpo"] = item.Cuerpo.replace(
                  /(\r\n|\n\r|\r|\n)/g,
                  "<br/>"
                );
                global_news[id]["Tema"] = item.TemaNoticia.replace(
                  /(\r\n|\n\r|\r|\n)/g,
                  "<br/>"
                );
                global_news[id]["Asunto"] = item.Asunto.replace(
                  /(\r\n|\n\r|\r|\n)/g,
                  "<br/>"
                );
                global_news[id]["Fuente"] = item.Fuente.replace(
                  /(\r\n|\n\r|\r|\n)/g,
                  "<br/>"
                );
                id++;
              });
              // cargamos el contenido y refrescamos la lista para que JQM coja bien los estilos
              $("#lmin").html(txtnot);
              $("#lmin").listview("refresh");
            } else {
              $("#p_lastmin").html(
                '<p class="error_txt">' + lang["jsonnull_lastmin"] + "</p>"
              );
            }
          },
          error: function (msg) {
            $("#p_lastmin").html(
              '<p class="error_txt">' + lang["ajaxerror"] + "</p>"
            );
          },
          complete: function () {
            hideLoading();
          },
        });
      }
    } else if (to_page_id == "pagepharmacies_prog") {
      //List programs
      showLoading();
      var dbManager = cof.service.DataBaseManager.sharedInstance();
      var networkManager = cof.service.NetworkManager.sharedInstance();
      var success = function (json) {
        if (json != null) {
          var str_html = "";
          $.each(json, function (i, item) {
            if (item == "Test vih-sifilis") {
              item = "Test VIH-Sífilis";
            }
            str_html += '<option value="' + i + '">' + item + "</option>";
          });
          $("#pg_selectProg").html(str_html);
          $("#pg_selectProg").selectmenu("refresh");
        } else {
          showAlert(lang["jsonnull_pha"]);
        }
      };
      var error = function (msg) {
        showAlert(lang["ajaxerror"], lang["error"]);
      };
      if (networkManager.isConnectedToInternet()) {
        var data = {
          op: "getPrograms",
          town: "town",
          serviceType: "serviceType",
          tok: sessionStorage.getItem("userToken"),
        };

        $.ajax({
          type: "POST",
          url: WS_URL,
          data: data,
          dataType: "json",
          success: success,
          error: error,
          complete: function () {
            showLocations();
          },
        });
      } else {
        showAlert(lang["no_connection"]);
        hideLoading();
      }

      function showLocations() {
        // List locations
        var progSuccess = function (json) {
          if (json != null) {
            var str_html = "";
            //Añadimos Donostia/San Sebastian al array y lo ordenamos alfabéticamente
            json.push("Donostia/San Sebastian");
            json.sort();
            str_html += '<option value="">' + lang["all_towns"] + "</option>";
            $.each(json, function (i, item) {
              if (item != null) {
                str_html +=
                  '<option data-townId="' +
                  item.townId +
                  '" value="' +
                  item.name +
                  '">' +
                  item.name +
                  "</option>";
              }
            });
            $("#pg_selectProgLoc").html(str_html);
            $("#pg_selectProgLoc").selectmenu("refresh");
          } else {
            showAlert(lang["jsonnull_pha"]);
          }
        };
        var progError = function (msg) {
          showAlert(lang["ajaxerror"], lang["error"]);
        };

        $.ajax({
          type: "POST",
          url: WS_URL,
          data: {
            op: "getLocations",
            tok: sessionStorage.getItem("userToken"),
            lang: lang["lang"],
          },
          dataType: "json",
          success: progSuccess,
          error: progError,
          complete: function () {
            hideLoading();
            //showNeighborhoods();
          },
        });

        function showNeighborhoods() {
          //List neighborhoods
          var neiSuccess = function (json) {
            if (json != null) {
              var str_html = "";
              str_html +=
                '<option value="">' + lang["all_neigborhood"] + "</option>";

              $.each(json, function (i, item) {
                str_html +=
                  '<option value="' + item + '">' + item + "</option>";
              });

              $("pg_selectProgLoc").html(str_html);
              $("pg_selectProgLoc").selectmenu("refresh");
            } else {
              showAlert(lang["jsonnull_pha"]);
            }
          };
          var neiError = function (msg) {
            showAlert(lang["ajaxerror"], lang["error"]);
          };

          $.ajax({
            type: "POST",
            url: WS_URL,
            data: { op: "getNeighborhoods", lang: lang["lang"] },
            dataType: "json",
            success: neiSuccess,
            error: neiError,
            complete: function () {
              hideLoading();
            },
          });
        }
      }
    } else if (to_page_id == "pagepharmacies") {
      getAuthToken();
      clearLocationWatch();
    } else if (to_page_id == "pagefavorites_list") {
      clearLocationWatch();
    } else if (to_page_id == "pagemore") {
      clearLocationWatch();
    }
  })

  .on("pagecontainerhide", function (event, ui) {
    var from_page_id = ui.toPage.attr("id");

    if (from_page_id == "#pagenexttome_map") {
      /*
       * Apartado CERCA DE MI - Map
       */
      $("#nexttomemap_canvas").empty();
      $("body").jqmRemoveData("map_canvas");
      $("body").jqmRemoveData("map_wpid");

      clearLocationWatch();
      google.maps.event.clearListeners(map, "bounds_changed");
    } else if (from_page_id == "pagenexttome_list") {
      /*
       * Apartado CERCA DE MI - List
       */
      //$('#listdynamic_ntmlist').empty();
      clearLocationWatch();
    } else if (from_page_id == "pagepharmacy_map") {
      /*
       * Apartado FARMACIAS - Lista Farmacias - Info Farmacia - Mapa
       */
      $("#pharmacymap_canvas").empty();
      $("body").jqmRemoveData("map_canvas");
      $("body").jqmRemoveData("map_wpid");

      clearLocationWatch();
    }
  });

$(document).on("pagebeforecreate", function (event) {
  translatePage($(this));
});

/*
 * Apartado CERCA DE MI - List
 */
$(document).on("pagebeforecreate", "#pagenexttome_list", function (event) {
  translatePage($(this));
});
$(document).on("click", ".ntmpha_link", function () {
  /*
   * Create the handler for pharmacy selection:
   * when a pharmacy is selected,
   * the next page (pagepharmacy_info) is filled with the information of the pharmacy
   */
  event.stopImmediatePropagation();
  event.preventDefault();
  //Set the selected pharmacy name as pagepharmacy_info page title
  $("#pagepharmacy_info_h1").text($(this).find("h1").first().text());

  showLoading();

  $("#listdynamic_p_info").empty();

  var pharmacy_id = $(this).attr("data-pharmacyid");
  var name = $(this).attr("data-name");
  var location = $(this).attr("data-location");
  var address = $(this).attr("data-address");
  var tel = $(this).attr("data-tel");
  var fax = $(this).attr("data-fax");
  var programs = $(this).attr("data-programs");
  var status = $(this).attr("data-status");
  var opening = $(this).attr("data-opening");
  var openingS = $(this).attr("data-openingS");
  var openingD = $(this).attr("data-openingD");
  var openingG = $(this).attr("data-openingG");
  var lat = $(this).attr("data-lat");
  var lng = $(this).attr("data-lng");
  var openingComplete = lang["opening"] + ":";

  if (opening && opening != "null" && opening != "false") {
    openingComplete += "<br/>" + lang["openingL"] + " " + opening;
  }
  if (openingS && openingS != "null" && openingS != "false") {
    openingComplete += "<br/>" + lang["openingS"] + " " + openingS;
  }
  if (openingD && openingD != "null" && openingD != "false") {
    openingComplete += "<br/>" + lang["openingD"] + " " + openingS;
  }
  // if (openingG && openingG != "null" && openingG != "false") {
  //   openingComplete = lang["openingG"] + ": " + openingG;
  // }

  var info =
    '<li data-role="list-divider" data-theme="b">' +
    name +
    '<p class="opening">' +
    openingComplete +
    "</p></li>";
  info +=
    '<li><a href="" class="map_link" data-pharmacyid="' +
    pharmacy_id +
    '" data-name="' +
    name +
    '" data-location="' +
    location +
    '" data-address="' +
    address +
    '" data-tel="' +
    tel +
    '" data-fax="' +
    fax +
    '" data-programs="' +
    programs +
    '" data-status="' +
    status +
    '" data-opening="' +
    openingComplete +
    '" data-lat="' +
    lat +
    '" data-lng="' +
    lng +
    '" ><img src="images/loc.png" class="ui-li-icon"/>' +
    address +
    "</a></li>";
  if (tel != "undefined" && tel != "null" && tel != "false" && tel.length > 0) {
    info +=
      '<li><a href="tel:' +
      tel +
      '" class="p_info_tel"><img src="images/tel.png" class="ui-li-icon"/>' +
      tel +
      "</a></li>";
  }
  if (fax != "undefined" && fax != "null" && fax != "false" && fax.length > 0) {
    info +=
      '<li><img src="images/tel.png" class="ui-li-icon"/><h1 class="p_info_fax">' +
      fax +
      '<span class="fax_txt"> (' +
      lang["fax"] +
      ")</span></h1></li>";
  }
  if (
    programs != "undefined" &&
    programs != "null" &&
    programs != "false" &&
    programs.length > 0
  ) {
    info +=
      '<li><h1 class="p_info_programs">' +
      lang["programs"] +
      ':<br><span class="fax_txt">' +
      programs +
      "</span></h1></li>";
  }
  $("#listdynamic_p_info").append(info);
  hideLoading();
  $.mobile.changePage("#pagepharmacy_info");

  return false;
});

/*
 * Apartado CERCA DE MI - Filter
 */
$(document).on("pagebeforecreate", "#pagenexttome_filter", function (event) {
  translatePage($(this));
  $("#ntm_submitfilter").on("click", function (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    $.mobile.changePage("#pagenexttome_map");
    return false;
  });
  var txt = $("#ntm_submitfilter").attr("data-t");
  var translation = gjson_lang[txt];
  $("#ntm_submitfilter").attr("value", translation);
});
/*
 * Apartado FARMACIAS
 */
$(document).on("pagebeforecreate", "#pagepharmacies", function (event) {
  translatePage($(this));
  $("#slow_loading_don").on("click", function (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    $.mobile.changePage("#pagedonosti_list");
    return false;
  });
  $("#slow_loading_gip").on("click", function (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    $.mobile.changePage("#pagegipuzkoa_list");
    return false;
  });
});
$(document).on("click", "#pagepharmacies_guard_id", function (event) {
  var networkManager = cof.service.NetworkManager.sharedInstance();
  if (!networkManager.isConnectedToInternet()) {
    showAlert(lang["no_connection"]);
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});
$(document).on("click", "#pagepharmacies_prog_id", function (event) {
  var networkManager = cof.service.NetworkManager.sharedInstance();
  if (!networkManager.isConnectedToInternet()) {
    showAlert(lang["no_connection"]);
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

/*
 * Apartado FARMACIAS - Guardia
 */
$(document).on("pagebeforecreate", "#pagepharmacies_guard", function (event) {
  /*
   * Create the handler for guard farmacies:
   * when the form is submitted,
   * the next page (pagepharmacies_list) is filled with the list of guard pharmacies
   */

  translatePage($(this));
  get_location();
  global_openBubleInfo = true;
  $("#pg_submitguard").on("click", function (event) {
    localStorage.setItem(
      "selectguardzone",
      $("#pg_selectguardzone option:selected").text()
    );

    event.stopImmediatePropagation();
    event.preventDefault();

    //Set the title to the list
    $("#pagepharmacies_list_h1").text(
      $("#pagepharmacies_guard").find("h1").first().text()
    );

    var formData = $("#form_guard").serialize();
    var data =
      "op=getPharmaciesGuard&lang=" +
      lang["lang"] +
      "&" +
      formData +
      "&userLat=" +
      global_userLat +
      "&userLng=" +
      global_userLng +
      "&tok=" +
      sessionStorage.getItem("userToken");

    showLoading();
    var success = function (json) {
      $("#listdynamic_pha").empty();
      if (json != null) {
        $.each(json, function (i, item) {
          var address;
          var address = item.address_num;

          var elem =
            '<li><a href="" class="pha_link ui-btn ui-btn-icon-right ui-icon-carat-r" data-pharmacyid="' +
            item.id +
            '" data-name="' +
            item.name +
            '" data-location="' +
            item.location +
            '" data-address="' +
            address +
            '" data-tel="' +
            item.telephone +
            '" data-fax="' +
            item.fax +
            '" data-programs="' +
            item.programs +
            '" data-status="' +
            item.status +
            '" data-opening="' +
            item.opening +
            '" data-openingS="' +
            item.openingS +
            '" data-openingD="' +
            item.openingD +
            '" data-guardOpening="' +
            item.guardOpening +
            '" data-guardClosing="' +
            item.guardClosing +
            '" data-lat="' +
            item.gps_coordx +
            '" data-lng="' +
            item.gps_coordy +
            '">' +
            "<h1>" +
            item.name +
            "</h1>" +
            "<p>" +
            item.address_name +
            "<br/>" +
            item.address_num +
            "</p>" +
            "<p>" +
            lang["openingG"] +
            ": </p>" +
            "<p>" +
            item.guardOpening +
            "-" +
            item.guardClosing +
            " </p>";

          var pharmacyDistance = calcualtePharmacyDistance(
            item.gps_coordx,
            item.gps_coordy
          );

          if (pharmacyDistance != undefined) {
            elem +=
              '<p class="ui-li-aside">' +
              pharmacyDistance +
              "</p>" +
              "</a></li>";
          } else {
            elem += "</a></li>";
          }

          $("#listdynamic_pha").append(elem);
        });
        hideLoading();
        $.mobile.changePage("#pagepharmacies_list");
      } else {
        hideLoading();
        showAlert(lang["jsonnull_phabyprog"]);
      }
    };
    var error = function (msg) {
      hideLoading();
      showAlert(lang["ajaxerror"], lang["error"]);
    };
    $.ajax({
      type: "GET",
      url: WS_URL,
      data: data,
      dataType: "json",
      success: success,
      error: error,
    });

    $("body").jqmRemoveData("map_wpid");
    return false;
  });

  /*
   * Create the handler to fill the correct number of days for the selected month:
   */
  $("#pg_selectmonth").on("change", function () {
    // Create day options and select the current day
    var options = "";
    var d = new Date();
    var dim = daysInMonth($(this).val(), d.getFullYear());
    for (var i = 1; i <= dim; i++) {
      options += '<option value="' + i + '">' + i + "</option>";
    }
    $("#pg_selectday").empty();
    $("#pg_selectday").html(options);
    $("#pg_selectday").selectmenu("refresh");
  });

  var txt = $("#pg_submitguard").attr("data-t");
  var translation = gjson_lang[txt];
  $("#pg_submitguard").attr("value", translation);
});
/*
 * Apartado FARMACIAS - Donosti
 */
$(document).on("pagebeforecreate", "#pagedonosti_list", function (event) {
  /*
   * Create the handler for location selection:
   * when a location is selected,
   * the next page is filled with the list of pharmacies
   */

  translatePage($(this));
  //get_location();
  global_openBubleInfo = true;

  showLoading();
});
$(document).on("click", ".nei_link", function (event) {
  event.stopImmediatePropagation();
  event.preventDefault();
  showLoading();

  //Set the selected location as pagepharmacies_list page title
  $("#pagepharmacies_list_h1").text($(this).jqmData("name"));

  var data =
    "op=getPharmacies&nei=" +
    $(this).attr("data-pharID") +
    "&tok=" +
    sessionStorage.getItem("userToken");
  var success = function (json) {
    $("#listdynamic_pha").empty();

    if (json != null) {
      $.each(json, function (i, item) {
        var address;
        var address = item.address_num;

        var elem =
          '<li><a href="" class="pha_link ui-btn ui-btn-icon-right ui-icon-carat-r" data-pharmacyid="' +
          item.id +
          '" data-name="' +
          item.name +
          '" data-location="' +
          item.location +
          '" data-address="' +
          address +
          '" data-tel="' +
          item.telephone +
          '" data-fax="' +
          item.fax +
          '" data-programs="' +
          item.programs +
          '" data-status="' +
          item.status +
          '" data-opening="' +
          item.opening +
          '" data-openingS="' +
          item.openingS +
          '" data-openingD="' +
          item.openingD +
          '" data-lat="' +
          item.gps_coordx +
          '" data-lng="' +
          item.gps_coordy +
          '">' +
          "<h1>" +
          item.name +
          "</h1>" +
          "<p>" +
          item.address_name +
          "<br/>" +
          item.address_num +
          "</p>";

        var pharmacyDistance = calcualtePharmacyDistance(
          item.gps_coordx,
          item.gps_coordy
        );

        if (pharmacyDistance != undefined) {
          elem +=
            '<p class="ui-li-aside">' + pharmacyDistance + "</p>" + "</a></li>";
        } else {
          elem += "</a></li>";
        }
        $("#listdynamic_pha").append(elem);
      });

      hideLoading();
      $.mobile.changePage("#pagepharmacies_list");
    } else {
      hideLoading();
      showAlert(lang["jsonnull_pha"]);
    }
  };
  var error = function (msg, b, c) {
    hideLoading();
    showAlert(lang["ajaxerror"], lang["error"]);
  };
  var dbManager = cof.service.DataBaseManager.sharedInstance();
  var networkManager = cof.service.NetworkManager.sharedInstance();
  if (dbManager.isDBOpen()) {
    dbManager
      .getFarmaciasBarrio(
        $(this).jqmData("name"),
        global_userLat,
        global_userLng
      )
      .then(function (json) {
        success(json);
        hideLoading();
      });
  } else if (networkManager.isConnectedToInternet()) {
    $.ajax({
      type: "GET",
      url: WS_URL,
      data: data,
      dataType: "json",
      success: success,
      error: error,
    });
  } else {
    hideLoading();
    showAlert(lang["no_connection"]);
  }
  $("body").jqmRemoveData("map_wpid");
  return false;
});
/*
 * Apartado FARMACIAS - Gipuzkoa
 */
$(document).on("pagebeforecreate", "#pagegipuzkoa_list", function (event) {
  translatePage($(this));
  get_location();
  global_openBubleInfo = true;

  var txt = "listfilter_placeholder";
  var translation = gjson_lang[txt];
  $("#listdynamic_gip").attr("data-filter-placeholder", translation);
});

$(document).on("click", ".loc_link", function () {
  /*
   * Create the handler for location selection:
   * when a location is selected,
   * the next page (pagepharmacies_list) is filled with the list of pharmacies
   */
  event.stopImmediatePropagation();
  event.preventDefault();
  showLoading();

  //Set the selected location as pagepharmacies_list page title
  $("#pagepharmacies_list_h1").text($(this).jqmData("name"));

  var data =
    "op=getPharmaciesByTown&lang=" +
    lang["lang"] +
    "&loc=" +
    $(this).jqmData("name") +
    "&userLat=" +
    global_userLat +
    "&userLng=" +
    global_userLng +
    "&tok=" +
    sessionStorage.getItem("userToken");
  var success = function (json) {
    $("#listdynamic_pha").empty();
    if (json != null) {
      if (json.length == 0) {
        hideLoading();
        showAlert(lang["ajaxerror"], lang["error"]);
      }
      $.each(json, function (i, item) {
        var address;
        var address = item.address_num;

        var elem =
          '<li><a href="" class="pha_link ui-btn ui-btn-icon-right ui-icon-carat-r" data-pharmacyid="' +
          item.id +
          '" data-name="' +
          item.name +
          '" data-location="' +
          item.location +
          '" data-address="' +
          address +
          '" data-tel="' +
          item.telephone +
          '" data-fax="' +
          item.fax +
          '" data-programs="' +
          item.programs +
          '" data-opening="' +
          item.opening +
          '" data-openingS="' +
          item.openingS +
          '" data-openingD="' +
          item.openingD +
          '" data-status="' +
          item.status +
          '" data-lat="' +
          item.gps_coordx +
          '" data-lng="' +
          item.gps_coordy +
          '">' +
          "<h1>" +
          item.name +
          "</h1>" +
          "<p>" +
          "<p>" +
          item.address_name +
          "<br/>" +
          item.address_num +
          "</p>";

        var pharmacyDistance = calcualtePharmacyDistance(
          item.gps_coordx,
          item.gps_coordy
        );

        if (pharmacyDistance != undefined) {
          elem +=
            '<p class="ui-li-aside">' + pharmacyDistance + "</p>" + "</a></li>";
        } else {
          elem += "</a></li>";
        }
        $("#listdynamic_pha").append(elem);
      });
      hideLoading();
      $.mobile.changePage("#pagepharmacies_list");
    } else {
      hideLoading();
      showAlert(lang["jsonnull_pha"]);
    }
  };
  var error = function (msg) {
    hideLoading();
    showAlert(lang["ajaxerror"], lang["error"]);
  };
  var dbManager = cof.service.DataBaseManager.sharedInstance();
  var networkManager = cof.service.NetworkManager.sharedInstance();
  if (dbManager.isDBOpen()) {
    dbManager
      .getFarmaciasPueblo(
        $(this).jqmData("name"),
        global_userLat,
        global_userLng
      )
      .then(function (json) {
        success(json);
        hideLoading();
      });
  } else if (networkManager.isConnectedToInternet()) {
    $.ajax({
      type: "GET",
      url: WS_URL,
      data: data,
      dataType: "json",
      success: success,
      error: error,
    });
  } else {
    hideLoading();
    showAlert(lang["no_connection"]);
  }
  $("body").jqmRemoveData("map_wpid");
  return false;
});
/*
 * Apartado FARMACIAS - Programas
 */
$(document).on("pagebeforecreate", "#pagepharmacies_prog", function (event) {
  /*
   * Create the handler for programs search form:
   * when the form is submitted,
   * the next page (pagepharmacies_list) is filled with the list of pharmacies which offer that programs
   */

  translatePage($(this));
  get_location();
  global_openBubleInfo = true;
  $("#pg_submitProg").on("click", function (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    showLoading();
    //Set the title to the list
    $("#pagepharmacies_list_h1").text(
      $("#pagepharmacies_prog").find("h1").first().text()
    );

    // the "nei" param is also serialze and send but we check location first so it works fine
    var formData = $("#form_prog").serialize();
    var prog = $("#pg_selectProg").val();
    var loc = $("#pg_selectProgLoc").val();
    var data = {
      op: "getProgramsByTypeAndTown",
      town: loc,
      serviceType: prog,
      tok: sessionStorage.getItem("userToken"),
    };

    var dbManager = cof.service.DataBaseManager.sharedInstance();
    var success = function (json) {
      $("#listdynamic_pha").empty();
      if (json != null && json.length > 0) {
        $.each(json, function (i, item) {
          var address;
          var address = item.address_num;

          var elem =
            '<li><a href="" class="pha_link ui-btn ui-btn-icon-right ui-icon-carat-r" data-pharmacyid="' +
            item.id +
            '" data-name="' +
            item.name +
            '" data-location="' +
            item.location +
            '" data-address="' +
            address +
            '" data-tel="' +
            item.telephone +
            '" data-fax="' +
            item.fax +
            '" data-programs="' +
            item.programs +
            '" data-status="' +
            item.status +
            '" data-opening="' +
            item.opening +
            '" data-openingS="' +
            item.openingS +
            '" data-openingD="' +
            item.openingD +
            '" data-lat="' +
            item.gps_coordx +
            '" data-lng="' +
            item.gps_coordy +
            '">' +
            "<h1>" +
            item.name +
            "</h1>" +
            "<p>" +
            item.location +
            "<br/>" +
            address +
            "</p>";
          var pharmacyDistance = calcualtePharmacyDistance(
            item.gps_coordx,
            item.gps_coordy
          );

          if (pharmacyDistance != undefined) {
            elem +=
              '<p class="ui-li-aside">' +
              pharmacyDistance +
              "</p>" +
              "</a></li>";
          } else {
            elem += "</a></li>";
          }

          $("#listdynamic_pha").append(elem);
        });
        hideLoading();
        $.mobile.changePage("#pagepharmacies_list");
      } else {
        hideLoading();
        showAlert(lang["jsonnull_phabyprog"]);
      }
    };
    var error = function (msg) {
      console.error(msg);
      hideLoading();
      showAlert(lang["ajaxerror"], lang["error"]);
    };

    $.ajax({
      type: "GET",
      url: WS_URL,
      data: data,
      dataType: "json",
      success: success,
      error: error,
    });

    $("body").jqmRemoveData("map_wpid");
    return false;
  });

  /*
   * Create the handler to show or hide neightborhoods select item:
   */
  $("#pg_selectProgLoc").on("change", function () {
    //showAlert($("#pg_divSelectProgNei").atrr("display"));
    // Create day options and select the current day
    if ($(this).val() !== "DONOSTIA/SAN SEBASTIAN") {
      $("#pg_divSelectProgNei").hide();
    } else {
      $("#pg_divSelectProgNei").show();
    }
  });

  var txt = $("#pg_submitProg").attr("data-t");
  var translation = gjson_lang[txt];
  $("#pg_submitProg").attr("value", translation);
});
/*
 * Apartado FARMACIAS - Lista Farmacias
 */
$(document).on("pagebeforecreate", "#pagepharmacies_list", function (event) {
  translatePage($(this));
  // pagebeforeshow
  // Redirect to location list when page is reloaded by the browser
  if ($("#listdynamic_pha > li").length == 0) {
    $.mobile.changePage("#pagepharmacies", {
      reverse: false,
      changeHash: false,
    });
  }
});
$(document).on("click", ".pha_link", function () {
  // Clear the previous selection of a pharmacy
  //$('#listdynamic_pha li').removeClass('ui-btn-active');

  //$('#listdynamic_pha').listview('refresh');

  /*
   * Create the handler for pharmacy selection:
   * when a pharmacy is selected,
   * the next page (pagepharmacy_info) is filled with the information of the pharmacy
   */
  global_openBubleInfo = true;

  event.stopImmediatePropagation();
  event.preventDefault();
  //Set the selected pharmacy name as pagepharmacy_info page title
  $("#pagepharmacy_info_h1").text($(this).find("h1").first().text());

  showLoading();

  $("#listdynamic_p_info").empty();
  var pharmacy_id = $(this).attr("data-pharmacyid");
  var name = $(this).attr("data-name");
  var location = $(this).attr("data-location");
  var address = $(this).attr("data-address");
  var tel = $(this).attr("data-tel");
  var fax = $(this).attr("data-fax");
  var programs = $(this).attr("data-programs");
  var status = $(this).attr("data-status");
  var opening = $(this).attr("data-opening");
  var openingS = $(this).attr("data-openingS");
  var openingD = $(this).attr("data-openingD");
  var openingG = $(this).attr("data-openingG");
  var lat = $(this).attr("data-lat");
  var lng = $(this).attr("data-lng");
  var guardOpening = $(this).attr("data-guardOpening");
  var guardClosing = $(this).attr("data-guardClosing");

  var openingComplete = lang["opening"] + ":";

  if (opening && opening != "null" && opening != "false") {
    openingComplete += "<br/>" + lang["openingL"] + " " + opening;
  }
  if (openingS && openingS != "null" && openingS != "false") {
    openingComplete += "<br/>" + lang["openingS"] + " " + openingS;
  }
  if (openingD && openingD != "null" && openingD != "false") {
    openingComplete += "<br/>" + lang["openingD"] + " " + openingS;
  }

  guardComplete = null;

  if (guardOpening && guardOpening != "null" && guardOpening != "false") {
    guardComplete =
      lang["openingG"] + ":<br/>" + guardOpening + "-" + guardClosing;
  }

  var info =
    '<li data-role="list-divider" data-theme="b">' +
    name +
    '<p class="opening">' +
    openingComplete +
    "</p></li>";

  if (guardComplete != null) {
    info +=
      '<li data-role="list-divider" data-theme="b" style="border: none" ><p class="opening">' +
      guardComplete +
      "</p></li>";
  }

  info +=
    '<li><a href="" class="map_link" data-pharmacyid="' +
    pharmacy_id +
    '" data-name="' +
    name +
    '" data-location="' +
    location +
    '" data-address="' +
    address +
    '" data-tel="' +
    tel +
    '" data-fax="' +
    fax +
    '" data-programs="' +
    programs +
    '" data-status="' +
    status +
    '" data-opening="' +
    openingComplete +
    '" data-lat="' +
    lat +
    '" data-lng="' +
    lng +
    '" ><img src="images/loc.png" class="ui-li-icon"/>' +
    address +
    "</a></li>";
  if (tel != "undefined" && tel != "null" && tel != "false" && tel.length > 0) {
    info +=
      '<li><a href="tel:' +
      tel +
      '" class="p_info_tel"><img src="images/tel.png" class="ui-li-icon"/>' +
      tel +
      "</a></li>";
  }
  if (fax != "undefined" && fax != "null" && fax != "false" && fax.length > 0) {
    info +=
      '<li><img src="images/tel.png" class="ui-li-icon"/><h1 class="p_info_fax">' +
      fax +
      '<span class="fax_txt"> (' +
      lang["fax"] +
      ")</span></h1></li>";
  }
  if (
    programs != "undefined" &&
    programs != "null" &&
    programs != "false" &&
    programs.length > 0
  ) {
    info +=
      '<li><h1 class="p_info_programs">' +
      lang["programs"] +
      ':<br><span class="fax_txt">' +
      programs +
      "</span></h1></li>";
  }
  $("#listdynamic_p_info").append(info);
  hideLoading();
  $.mobile.changePage("#pagepharmacy_info");
  return false;
});
/*
 * Apartado FARMACIAS - Lista Farmacias - Info Farmacia
 */
$(document).on("pagebeforecreate", "#pagepharmacy_info", function (event) {
  translatePage($(this));
});
$(document).on("click", "#linkfavorite", function () {
  // Add and delete favorite event
  event.stopImmediatePropagation();
  event.preventDefault();
  var new_c_fav;
  if ($(this).attr("data-icon") == "ui-icon-custom-iconaddfavorite") {
    // Add the favorite
    var c_fav = getValue("cofg_favorites");
    if (c_fav == undefined || c_fav == "") {
      new_c_fav = $(".map_link").attr("data-pharmacyid");
    } else {
      new_c_fav = c_fav + "*" + $(".map_link").attr("data-pharmacyid");
    }
    setValue("cofg_favorites", new_c_fav);
    $(this).attr("data-icon", "ui-icon-custom-icondeletefavorite");
    $(this)
      .find(".ui-icon")
      .css(
        "background",
        "url(images/icondeletefavorite.png) no-repeat 50% 50%"
      );
    $(this)
      .removeClass("ui-icon-custom-iconaddfavorite")
      .addClass("ui-icon-custom-icondeletefavorite");
    showAlert(lang["favoriteadded"]);
  } else {
    // Delete the favorite because it exists
    var c_fav = getValue("cofg_favorites");
    var a_fav = c_fav.split("*");
    for (var i = 0; i < a_fav.length; i++) {
      if (a_fav[i] == $(".map_link").attr("data-pharmacyid")) {
        a_fav.splice(i, 1);
        new_c_fav = a_fav.join("*");
        setValue("cofg_favorites", new_c_fav);
        break;
      }
    }
    $(this).attr("data-icon", "ui-icon-custom-iconaddfavorite");
    $(this)
      .find(".ui-icon")
      .css("background", "url(images/iconaddfavorite.png) no-repeat 50% 50%");
    $(this)
      .removeClass("ui-icon-custom-icondeletefavorite")
      .addClass("ui-icon-custom-iconaddfavorite");
    showAlert(lang["favoritedeleted"]);
  }
  return false;
});
/*
 * Apartado FARMACIAS - Lista Farmacias - Info Farmacia - Mapa
 */
$(document).on("pagebeforecreate", "#pagepharmacy_map", function (event, ui) {
  translatePage($(this));
  // Redirect to location list when page is reloaded by the browser
  global_openBubleInfo = true;
  if (global_markers.length == 0) {
    $.mobile.changePage("#pagepharmacies", {
      reverse: false,
      changeHash: false,
    });
  }
});
/*
 * Apartado FAVORITOS - Lista Farmacias
 */
$(document).on("pagebeforecreate", "#pagefavorites_list", function (event) {
  translatePage($(this));
});

$(document).on("click", ".favpha_link", function (event) {
  /*
   * Create the handler for pharmacy selection in favorites:
   * when a pharmacy is selected,
   * the next page (pagepharmacy_info) is filled with the information of the pharmacy
   */

  event.stopImmediatePropagation();
  event.preventDefault();
  //Set the selected pharmacy name as pagepharmacy_info page title
  $("#pagepharmacy_info_h1").text($(this).find("h1").first().text());

  showLoading();

  $("#listdynamic_p_info").empty();
  var pharmacy_id = $(this).attr("data-pharmacyid");
  var name = $(this).attr("data-name");
  var location = $(this).attr("data-location");
  var address = $(this).attr("data-address");
  var tel = $(this).attr("data-tel");
  var fax = $(this).attr("data-fax");
  var programs = $(this).attr("data-programs");
  var status = $(this).attr("data-status");
  var opening = $(this).attr("data-opening");
  var openingS = $(this).attr("data-openingS");
  var openingD = $(this).attr("data-openingD");
  var openingG = $(this).attr("data-openingG");
  var lat = $(this).attr("data-lat");
  var lng = $(this).attr("data-lng");
  var openingComplete = lang["opening"] + ":";
  if (opening && opening != "null" && opening != "false") {
    openingComplete += "<br/>" + lang["openingL"] + " " + opening;
  }
  if (openingS && openingS != "null" && openingS != "false") {
    openingComplete += "<br/>" + lang["openingS"] + " " + openingS;
  }
  if (openingD && openingD != "null" && openingD != "false") {
    openingComplete += "<br/>" + lang["openingD"] + " " + openingS;
  }
  // if (openingG && openingG != "null" && openingG != "false") {
  //   openingComplete = lang["openingG"] + ": " + openingG;
  // }

  var info =
    '<li data-role="list-divider" data-theme="b">' +
    name +
    '<p class="opening">' +
    openingComplete +
    "</p></li>";
  info +=
    '<li><a href="" class="map_link" data-pharmacyid="' +
    pharmacy_id +
    '" data-name="' +
    name +
    '" data-location="' +
    location +
    '" data-address="' +
    address +
    '" data-tel="' +
    tel +
    '" data-fax="' +
    fax +
    '" data-programs="' +
    programs +
    '" data-status="' +
    status +
    '" data-opening="' +
    openingComplete +
    '" data-lat="' +
    lat +
    '" data-lng="' +
    lng +
    '" ><img src="images/loc.png" class="ui-li-icon"/>' +
    address +
    "</a></li>";
  if (tel != "undefined" && tel != "null" && tel != "false" && tel.length > 0) {
    info +=
      '<li><a href="tel:' +
      tel +
      '" class="p_info_tel"><img src="images/tel.png" class="ui-li-icon"/>' +
      tel +
      "</a></li>";
  }
  if (fax != "undefined" && fax != "null" && fax != "false" && fax.length > 0) {
    info +=
      '<li><img src="images/tel.png" class="ui-li-icon"/><h1 class="p_info_fax">' +
      fax +
      '<span class="fax_txt"> (' +
      lang["fax"] +
      ")</span></h1></li>";
  }
  if (
    programs != "undefined" &&
    programs != "null" &&
    programs != "false" &&
    programs.length > 0
  ) {
    info +=
      '<li><h1 class="p_info_programs">' +
      lang["programs"] +
      ':<br><span class="fax_txt">' +
      programs +
      "</span></h1></li>";
  }
  $("#listdynamic_p_info").append(info);
  hideLoading();
  $.mobile.changePage("#pagepharmacy_info");
  return false;
});
/*
 * Apartado MAS
 */
$(document).on("pagebeforecreate", "#pagemore", function (event) {
  translatePage($(this));
});
/*
 * Apartado MAS - Ultima hora
 */
$(document).on("pagebeforecreate", "#pagemore_lastminute", function (event) {
  translatePage($(this));
});
$(document).on("click", "#pagemore_lastminute_link", function (event) {
  var networkManager = cof.service.NetworkManager.sharedInstance();
  if (!networkManager.isConnectedToInternet()) {
    showAlert(lang["no_connection"]);
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

$(document).on("click", ".news_link", function () {
  // Se carga la info de la noticia seleccionada en #pagemore_lastminute_description en el click
  event.stopImmediatePropagation();
  event.preventDefault();
  global_news["id"] = $(this).attr("data-idnew");

  var textoNot = "";

  //textoNot += '<li data-role="list-divider">'+ global_news[global_news['id']]['Fecha'] + ' ' + global_news[global_news['id']]['Entrada'] + '</li>';

  textoNot += "<p>" + global_news[global_news["id"]]["Entrada"] + "</p>";
  textoNot += "<p>Fecha: " + global_news[global_news["id"]]["Fecha"] + "</p>";
  textoNot +=
    "<p>Noticia: " + global_news[global_news["id"]]["Noticia"] + "</p>";
  textoNot += "<p>" + global_news[global_news["id"]]["Cuerpo"] + "</p>";

  $("#notice_title").html(global_news[global_news["id"]]["Entrada"]);

  $("#lmindesc").html(textoNot);

  $.mobile.changePage("#pagemore_lastminute_description");

  return false;
});
/*
 * Apartado MAS - Colegio
 */
$(document).on("pagebeforecreate", "#pagemore_college", function (event) {
  /*
   * Create the handler for address selection:
   * when the address of the college is selected,
   * the next page (pagepharmacy_map) is filled with map
   */

  translatePage($(this));
  global_openBubleInfo = true;

  var map_link = $("#pagemore_college_map_link");
  var cof_lat = gjson_lang["cofg_lat"];
  var cof_lng = gjson_lang["cofg_lng"];
  var geoUri =
    "http://maps.google.com/?q=Colegio+Oficial+de+Farmaceuticos+de+Guipuzcoa";
  map_link.attr("href", geoUri);

  var tel_link = $("#pagemore_college_tel_link");
  var tel_url = "tel:" + gjson_lang["cofg_tel"].replace(" ", "");

  tel_link.attr("href", tel_url);

  var mail_link = $("#pagemore_college_mail_link");
  var mail_url = "mailto:" + gjson_lang["cofg_mail"];
  mail_link.attr("href", mail_url);

  var web_link = $("#pagemore_college_web_link");
  var web_url = gjson_lang["cofg_web"];
  web_link.attr("href", web_url);
});

$(document).on(
  "pagebeforecreate",
  "#pagemore_dentalEmergencies",
  function (event) {
    /*
     * Create the handler for address selection:
     * when the address of the college is selected,
     * the next page (pagepharmacy_map) is filled with map
     */

    translatePage($(this));
    global_openBubleInfo = true;

    var tel_link = $("#pagemore_dental_tel_link");
    var tel_url = "tel:" + gjson_lang["dental_telephone"].replace(" ", "");
    tel_link.attr("href", tel_url);
  }
);

$(document).on("click", "a", function (event) {
  if (document.domain == "") {
    var desturl = $(this).attr("href");
    if (
      $(this).attr("target") == "_blank" ||
      $(this).attr("rel") === "external" ||
      ($(this).attr("href") &&
        $(this)
          .attr("href")
          .match(/^(tel|mailto)\:/g))
    ) {
      if (
        (navigator.userAgent.match(/iPhone/i) ||
          navigator.userAgent.match(/iPad/i)) &&
        !$(this)
          .attr("href")
          .match(/^(tel)\:/g)
      ) {
        event.preventDefault();
        window.open(desturl, "_system");
        return false;
      }
    }
  }
});

$(document).on("click", ".news_link", function () {
  // Se carga la info de la noticia seleccionada en #pagemore_lastminute_description en el click
  event.stopImmediatePropagation();
  event.preventDefault();
  global_news["id"] = $(this).attr("data-idnew");

  var textoNot = "";

  textoNot += "<p>" + global_news[global_news["id"]]["Entrada"] + "</p>";
  textoNot += "<p>Fecha: " + global_news[global_news["id"]]["Fecha"] + "</p>";
  textoNot +=
    "<p>Noticia: " + global_news[global_news["id"]]["Noticia"] + "</p>";
  textoNot += "<p>" + global_news[global_news["id"]]["Cuerpo"] + "</p>";

  $("#notice_title").html(global_news[global_news["id"]]["Entrada"]);

  $("#lmindesc").html(textoNot);

  $.mobile.changePage("#pagemore_lastminute_description");

  return false;
});
