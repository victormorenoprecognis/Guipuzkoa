var cof = window.cof || {};
cof.service = cof.service || {};
cof.service.DataBaseManager = (function () {
  "use strict";

  var instance;
  var dbManager = {};
  var db = null;
  var fileManager = cof.service.FileManager.sharedInstance();

  /**
   * Receives the id of the pharmacy and returns the associated programs
   * @param int id
   *
   * @return string programs
   */
  function allProgramsForPharmacyWithID(id) {
    console.log("allProgramsForPharmacyWithID");
    var programsDeferred = Q.defer();
    var allPrograms = "";
    db.transaction(
      function (tx) {
        tx.executeSql(
          "SELECT DISTINCT(programa_" +
            lang["lang"] +
            ") AS programa" +
            " FROM farmacia_programas" +
            " WHERE id_farmacia=" +
            id +
            ' AND (fecha_baja IS NULL OR fecha_baja="" OR fecha_baja>date("now"))' +
            " ORDER BY programa ASC;",
          [],
          function (tx, res2) {
            for (var j = res2.rows.length - 1; j >= 0; j--) {
              allPrograms += res2.rows.item(j).programa + "; ";
            }
            programsDeferred.resolve(allPrograms);
          }
        );
      },
      function (e) {
        console.log("ERROR: " + e.message);
      }
    );
    return programsDeferred.promise;
  }
  /**
   * Checks if a certain pharmacy has a certain program
   * @param int pharmacy id
   * @param program id
   * @return string programs
   */
  function pharmacyHasTheProgram(pharmacyID, programID) {
    console.log("pharmacyHasTheProgram");
    var deferred = Q.defer();
    var allPrograms = "";
    db.transaction(
      function (tx) {
        tx.executeSql(
          "SELECT count(*) as count" +
            " FROM farmacia_programas" +
            " WHERE id_farmacia=" +
            pharmacyID +
            " AND id_programa=" +
            programID +
            ' AND (fecha_baja IS NULL OR fecha_baja="" OR fecha_baja>date("now"))',
          [],
          function (tx, res2) {
            res2.rows.item(0).count == 1
              ? deferred.resolve(true)
              : deferred.resolve(false);
          }
        );
      },
      function (e) {
        console.log("ERROR: " + e.message);
      }
    );
    return deferred.promise;
  }
  /**
   * Gets the opening string and transforms the string to an opening weekly schedule
   * @param String opening
   * @return Opening Object
   */
  function processOpening(opening) {
    var openingArray = opening.split(";");
    return {
      opening: openingArray[0],
      openingS: openingArray[1],
      openingD: openingArray[2],
    };
  }
  /**
   * Get the pharmacy with the id identifier
   * @param int id
   * @return Pharmacy Object
   */
  function getFarmaciaWithID(id, latitude, longitude) {
    var getFarmaciaDeferred = Q.defer();

    db.transaction(
      function (tx) {
        tx.executeSql(
          "select id,nombre,direccion,municipio,telefono,fax,latitud,longitud,starred,opening from farmacias where id='" +
            id +
            "';",
          [],
          function (tx, res) {
            var farmacias = [];
            for (var i = 0; i < res.rows.length; i++) {
              farmacias.push(res.rows.item(i));
            }
            if (farmacias.length > 0) {
              allProgramsForPharmacyWithID(farmacias[0].id).then(function (
                programs
              ) {
                var row = farmacias[0];
                var opening = processOpening(row.opening);
                getFarmaciaDeferred.resolve({
                  id: row.id,
                  name: row.nombre,
                  address_name: row.direccion,
                  location: row.municipio,
                  telephone: row.telefono,
                  fax: row.fax,
                  gps_coordx: row.latitud,
                  gps_coordy: row.longitud,
                  starred: row.starred,
                  opening: opening.opening,
                  openingS: opening.openingS,
                  openingD: opening.openingD,
                  programs: programs,
                  distance: Distance(
                    latitude,
                    longitude,
                    row.latitud,
                    row.longitud
                  ),
                });
              });
            } else {
              getFarmaciaDeferred.resolve(null);
            }
          }
        );
      },
      function (e) {
        console.log("ERROR: " + e.message);
      }
    );

    return getFarmaciaDeferred.promise;
  }
  /**
   * check if it is needed a Data Base update
   * @param creationTimeDDBB timestamp of the DDBB creation time
   */
  function checkUpdateDDBB(creationTimeDDBB) {
    var needUpdate = false;
    try {
      console.log("*** creationTimeDDBB: " + creationTimeDDBB);
      var lastUpdateTime = getValue("lastUpdate");
      console.log("*** lastUpdateDate: " + lastUpdateTime);
      if (
        creationTimeDDBB &&
        !isNaN(lastUpdateTime) &&
        lastUpdateTime &&
        !isNaN(lastUpdateTime)
      ) {
        if (lastUpdateTime < creationTimeDDBB) {
          console.log(
            "*** creationTimeDDBB && lastUpdate<creationTimeDDBB: true"
          );
          needUpdate = true;
        }
      } else {
        needUpdate = true;
      }
    } catch (err) {
      console.log("*** checkUpdateDDBB catch: " + err);
      needUpdate = true;
    } finally {
      console.log("*** needUpdate: " + needUpdate);
      return needUpdate;
    }
  }
  /**
   * Function to start DDBB download
   * @param win Current window
   */
  function needUpdateDDBB() {
    var r = confirm(lang["update_ddbb"]);
    if (r == true) {
      downloadDDBB();
    }
  }
  function DataBaseManager() {
    console.log("DataBase Manager Instantiation");
    return {
      openDB: function () {
        console.log("DataBaseManager, openDB db: " + db);
        if (db == null) {
          console.log("DataBaseManager, openDB deviceType(): " + deviceType());
          if (deviceType() == "Android") {
            db = window.sqlitePlugin.openDatabase({
              name: "farmacias.db",
              location: "default",
            });
          } else {
            db = window.sqlitePlugin.openDatabase({
              name: "database/farmacias.db",
              location: "default",
            });
          }
        }
        return db;
      },
      isDBOpen: function () {
        if (db == null) {
          return false;
        } else {
          return true;
        }
      },
      /**
       * Gets the annotations (GMaps) of the farmacias near the selected point.
       * @param float latitude //Latitude of the point whose near farmacias we want to get.
       * @param float longitude //Longititude of the point whose near farmacias we want to get.
       * @param float latitudeDelta //Latitude delta to set what farmacias are near.
       * @param float longitudeDelta //Longititude delta to set what farmacias are near.
       * @param boolean excludePharmacies //Boolean to not get the previous pharmacies showed
       * @param boolean limit //integer limit the pharmacies to fetch
       */
      getAnnotationsFarmaciasNearXY: function (
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
        excludePharmacies,
        pharmaciesInMap,
        limit
      ) {
        console.log("getAnnotationsFarmaciasNearXY");
        var deferred = Q.defer();
        var lat = Math.abs(latitude);
        var lon = Math.abs(longitude);

        //  We get only the pharmacies we don't showed in map before
        var stringPharmaciesInMap = excludePharmacies
          ? pharmaciesInMap.join(",")
          : "";

        var query =
          "SELECT id,nombre,direccion,municipio,telefono,fax,latitud,longitud,starred,opening" +
          " FROM farmacias WHERE (abs(latitud) > " +
          (lat - Math.abs(latitudeDelta)) +
          ") AND (abs(latitud) < " +
          (lat + Math.abs(latitudeDelta)) +
          ")" +
          " AND (abs(longitud) > " +
          (lon - Math.abs(longitudeDelta)) +
          ") AND (abs(longitud) < " +
          (+lon + Math.abs(longitudeDelta)) +
          ")" +
          " AND id NOT IN (" +
          stringPharmaciesInMap +
          ') AND latitud!="" AND longitud!="" LIMIT ' +
          limit +
          " ;";
        try {
          db.transaction(
            function (tx) {
              tx.executeSql(query, [], function (tx, res) {
                var items = [];
                for (var i = 0; i < res.rows.length; i++) {
                  items.push(res.rows.item(i));
                }
                var farmacias = _.map(items, function (row) {
                  var opening = processOpening(row.opening);
                  return {
                    id: row.id,
                    name: row.nombre,
                    address_name: row.direccion,
                    subtitulo: formatAddress(row.direccion, row.municipio),
                    location: row.municipio,
                    telephone: row.telefono,
                    fax: row.fax,
                    gps_coordx: row.latitud,
                    gps_coordy: row.longitud,
                    starred: row.starred,
                    opening: opening.opening,
                    openingS: opening.openingS,
                    openingD: opening.openingD,
                    distance: Distance(
                      latitude,
                      longitude,
                      row.latitud,
                      row.longitud
                    ),
                  };
                });

                farmacias.sort(sortAssociativeArrayByDistance);

                var annotations = _.map(farmacias, function (farmacia) {
                  farmacia.animate = true;
                  return farmacia;
                });

                deferred.resolve(annotations);
              });
            },
            function (e) {
              console.log("ERROR: " + e.message);
              deferred.reject();
            }
          );
        } catch (e) {
          console.log(e);
        }

        return deferred.promise;
      },
      /**
       * Returns an array with the farmacias near XY specified in params
       * @param float Latitude of the point whose near farmacias we want to get.
       * @param float Longititude of the point whose near farmacias we want to get.
       * @param float Latitude delta to set what farmacias are near.
       * @param float Longititude delta to set what farmacias are near.
       *
       * @return array farmacias[id,nombre,direccion,municipio,telefono,latitud,longitud,starred]
       */
      getFamarciasNearXY: function (
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta
      ) {
        console.log("getFamarciasNearXY");
        var deferred = Q.defer();
        var farmacias = [];
        var lat = Math.abs(latitude);
        var lon = Math.abs(longitude);

        db.transaction(
          function (tx) {
            tx.executeSql(
              "SELECT id,nombre,direccion,municipio,telefono,fax,latitud,longitud,starred,opening" +
                " FROM farmacias WHERE (abs(latitud) > " +
                (lat - Math.abs(latitudeDelta)) +
                ") AND (abs(latitud) < " +
                (lat + Math.abs(latitudeDelta)) +
                ")" +
                " AND (abs(longitud) > " +
                (lon - Math.abs(longitudeDelta)) +
                ") AND (abs(longitud) < " +
                (+lon + Math.abs(longitudeDelta)) +
                ")" +
                ' AND latitud!="" AND longitud!="";',
              [],
              function (tx, res) {
                var items = [];
                for (var i = 0; i < res.rows.length; i++) {
                  items.push(res.rows.item(i));
                }
                var farmaciasPromise = _.map(items, function (row) {
                  return allProgramsForPharmacyWithID(row.id).then(function (
                    programs
                  ) {
                    var opening = processOpening(row.opening);
                    return {
                      id: row.id,
                      name: row.nombre,
                      address_name: row.direccion,
                      location: row.municipio,
                      telephone: row.telefono,
                      fax: row.fax,
                      gps_coordx: row.latitud,
                      gps_coordy: row.longitud,
                      starred: row.starred,
                      opening: opening.opening,
                      openingS: opening.openingS,
                      openingD: opening.openingD,
                      programs: programs,
                      distance: Distance(
                        latitude,
                        longitude,
                        row.latitud,
                        row.longitud
                      ),
                    };
                  });
                });

                Q.all(farmaciasPromise).then(function (farmacias) {
                  deferred.resolve(farmacias);
                });
              }
            );
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Get all the neighbourhoods of Donostia.
       * @return String[] with all the neighbourhoods of Donostia.
       */
      getNeighborhoods: function () {
        console.log("getNeighborhoods");
        var deferred = Q.defer();

        db.transaction(
          function (tx) {
            tx.executeSql(
              'select distinct(municipio) from farmacias where municipio like "%' +
                lang["Donosti"] +
                '%" order by municipio asc;',
              [],
              function (tx, res) {
                var barrios = [];
                for (var i = 0; i < res.rows.length; i++) {
                  var nei = res.rows.item(i).municipio.split("(");
                  barrios.push(
                    nei[0].replace(/^\s+/g, "").replace(/\s+$/g, "")
                  );
                }
                barrios = _.filter(barrios, function (barrio) {
                  return barrio != lang["Donosti"];
                });
                deferred.resolve(barrios);
              }
            );
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Get all the neighbourhoods of Donostia.
       * @return String[] with all the neighbourhoods of Donostia.
       */
      getBarrios: function () {
        console.log("getBarrios");
        var deferred = Q.defer();

        db.transaction(
          function (tx) {
            tx.executeSql(
              "select distinct(municipio) from farmacias where municipio = '" +
                lang["Donosti"] +
                "' order by municipio asc;",
              [],
              function (tx, res) {
                var barrios = [];
                for (var i = 0; i < res.rows.length; i++) {
                  var nombreBarrio = res.rows.item(i).municipio;
                  var posDonosti = nombreBarrio.indexOf(
                    " (" + lang["Donosti"] + ")"
                  );

                  if (posDonosti > -1) {
                    nombreBarrio = nombreBarrio.substring(0, posDonosti);
                  }

                  barrios.push(nombreBarrio);
                }
                deferred.resolve(barrios);
              }
            );
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Get all the farmacias of the selected neighbourhood.
       * @param String Neighbourhood whose farmacias to get.
       * @return String[] Farmacias of the neighbourhood.
       */
      getFarmaciasBarrio: function (barrio, latitude, longitude) {
        var deferred = Q.defer();

        db.transaction(
          function (tx) {
            tx.executeSql(
              'select id,nombre,direccion,municipio,telefono,fax,latitud,longitud,starred,opening from farmacias where municipio like "' +
                barrio +
                '%" order by nombre asc;',
              [],
              function (tx, res) {
                var farmacias = [];
                for (var i = 0; i < res.rows.length; i++) {
                  farmacias.push(res.rows.item(i));
                }

                var farmaciasPromise = _.map(farmacias, function (row) {
                  return allProgramsForPharmacyWithID(row.id).then(function (
                    programs
                  ) {
                    var opening = processOpening(row.opening);
                    return {
                      id: row.id,
                      name: row.nombre,
                      address_name: row.direccion,
                      location: row.municipio,
                      telephone: row.telefono,
                      fax: row.fax,
                      gps_coordx: row.latitud,
                      gps_coordy: row.longitud,
                      starred: row.starred,
                      opening: opening.opening,
                      openingS: opening.openingS,
                      openingD: opening.openingD,
                      programs: programs,
                      distance: Distance(
                        latitude,
                        longitude,
                        row.latitud,
                        row.longitud
                      ),
                    };
                  });
                });

                Q.all(farmaciasPromise).then(function (farmaciasPrometidas) {
                  deferred.resolve(farmaciasPrometidas);
                });
              }
            );
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Get all the villages of Gipuzkoa.
       * @return Array with all the names of the villages from Gipuzkoa.
       */
      getLocations: function () {
        var deferred = Q.defer();
        var nombres = [];

        db.transaction(
          function (tx) {
            var sqlStatement =
              "select distinct(municipio) from farmacias where not municipio = '" +
              lang["Donosti"] +
              "' order by municipio asc;";
            tx.executeSql(sqlStatement, [], function (tx, res) {
              for (var i = 0; i < res.rows.length; i++) {
                var pueblo = res.rows.item(i).municipio.split(";");
                nombres.push(
                  pueblo[0].replace(/^\s+/g, "").replace(/\s+$/g, "")
                );
              }

              deferred.resolve(nombres);
            });
          },
          function (e) {
            throw new Error(e);
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Get all the villages of Gipuzkoa.
       * @return String[] with all the villages of Gipuzkoa.
       */
      getPueblosGipuzkoa: function () {
        var deferred = Q.defer();
        var pueblos = [];
        db.transaction(
          function (tx) {
            var sqlStatement =
              "select distinct(municipio) from farmacias where not municipio = '" +
              lang["Donosti"] +
              "' order by municipio asc;";
            tx.executeSql(sqlStatement, [], function (tx, res) {
              for (var i = 0; i < res.rows.length; i++) {
                pueblos.push(res.rows.item(i).municipio);
              }

              deferred.resolve(pueblos);
            });
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Get all the farmacias of the selected village.
       * @param String Village whose farmacias to get.
       * @return String[] Farmacias of the village.
       */
      getFarmaciasPueblo: function (pueblo, latitude, longitude) {
        var deferred = Q.defer();
        var farmacias = [];
        db.transaction(
          function (tx) {
            var sqlStatement =
              "select id,nombre,direccion,municipio,telefono,fax,latitud,longitud,starred,opening from farmacias where municipio='" +
              pueblo +
              "' order by nombre asc;";
            tx.executeSql(sqlStatement, [], function (tx, res) {
              for (var i = 0; i < res.rows.length; i++) {
                farmacias.push(res.rows.item(i));
              }
              /*
                        var farmacias = [];
        				for (var i = res.rows.length - 1; i <= 0; i++) {
        					farmacias.push(res.rows.item(i));
        				}
                        */
              var farmaciasPromise = _.map(farmacias, function (row) {
                return allProgramsForPharmacyWithID(row.id).then(function (
                  programs
                ) {
                  var opening = processOpening(row.opening);
                  return {
                    id: row.id,
                    name: row.nombre,
                    address_name: row.direccion,
                    location: row.municipio,
                    telephone: row.telefono,
                    fax: row.fax,
                    gps_coordx: row.latitud,
                    gps_coordy: row.longitud,
                    starred: row.starred,
                    opening: opening.opening,
                    openingS: opening.openingS,
                    openingD: opening.openingD,
                    programs: programs,
                    distance: Distance(
                      latitude,
                      longitude,
                      row.latitud,
                      row.longitud
                    ),
                  };
                });
              });

              Q.all(farmaciasPromise).then(function (farmaciasPrometidas) {
                deferred.resolve(farmaciasPrometidas);
              });
            });
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Get all the farmacias of the selected village with a certain program.
       * @param String Village whose farmacias to get.
       * @param String Program ID.
       * @param String lang of the user.
       * @return String[] Farmacias of the village.
       */
      getFarmaciasPuebloFilter: function (pueblo, programID) {
        var deferred = Q.defer();
        var farmacias = [];
        db.transaction(
          function (tx) {
            var sqlStatement =
              "select id,nombre,direccion,municipio,telefono,fax,latitud,longitud,starred,opening from farmacias where municipio='" +
              pueblo +
              "' order by nombre asc;";
            tx.executeSql(sqlStatement, [], function (tx, res) {
              var farmacias = [];
              for (var i = 0; i < res.rows.length; i++) {
                farmacias.push(res.rows.item(i));
              }

              var farmaciasMarcadasPromise = _.map(
                farmacias,
                function (farmacia) {
                  return pharmacyHasTheProgram(farmacia.id, programID).then(
                    function (result) {
                      farmacia.hasProgram = result;
                      return farmacia;
                    }
                  );
                }
              );

              Q.all(farmaciasMarcadasPromise).then(function (
                farmaciasPrometidas
              ) {
                farmacias = _.filter(farmacias, function (farmacia) {
                  return farmacia.hasProgram;
                });
                var farmaciasPromise = _.map(farmacias, function (row) {
                  return allProgramsForPharmacyWithID(row.id).then(function (
                    programs
                  ) {
                    var opening = processOpening(row.opening);
                    return {
                      id: row.id,
                      name: row.nombre,
                      address_name: row.direccion,
                      location: row.municipio,
                      telephone: row.telefono,
                      fax: row.fax,
                      gps_coordx: row.latitud,
                      gps_coordy: row.longitud,
                      starred: row.starred,
                      opening: opening.opening,
                      openingS: opening.openingS,
                      openingD: opening.openingD,
                      programs: programs,
                    };
                  });
                });

                Q.all(farmaciasPromise).then(function (farmaciasPrometidas) {
                  deferred.resolve(farmaciasPrometidas);
                });
              });
            });
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Get all the guard zones.
       * @return All the guard zones.
       */
      getGuardZones: function () {
        var deferred = Q.defer();
        var zonas = [];

        db.transaction(
          function (tx) {
            var sqlStatement =
              "select id,name from guard_zones order by name asc;";
            tx.executeSql(sqlStatement, [], function (tx, res) {
              for (var i = 0; i < res.rows.length; i++) {
                zonas.push({
                  idZoneGuard: res.rows.item(i).id,
                  name: res.rows.item(i).name,
                });
              }

              deferred.resolve(zonas);
            });
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Get all the programs.
       * @return Array //All the programs.
       */
      getPrograms: function () {
        var deferred = Q.defer();
        var programas = {};
        db.transaction(
          function (tx) {
            var sqlStatement =
              "SELECT DISTINCT(id_programa),programa_" +
              lang["lang"] +
              " AS programa FROM farmacia_programas ORDER BY programa ASC;";
            tx.executeSql(sqlStatement, [], function (tx, res) {
              for (var i = 0; i < res.rows.length; i++) {
                programas[res.rows.item(i).id_programa.toString()] =
                  res.rows.item(i).programa;
              }

              deferred.resolve(programas);
            });
          },
          function (e) {
            throw new Error(e);
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Get all the pharmacies.
       * @return Array //All the pharmacies.
       */
      getFarmacias: function () {
        var deferred = Q.defer();
        var listadoFamacias = [];

        db.transaction(
          function (tx) {
            tx.executeSql("select * from farmacias;", [], function (tx, res) {
              for (var i = res.rows.length - 1; i >= 0; i--) {
                var farmacia = {};
                farmacia.nombre = res.rows.item(i).nombre;
                farmacia.direccion = res.rows.item(i).direccion;
                farmacia.municipio = res.rows.item(i).municipio;
                farmacia.telefono = res.rows.item(i).telefono;
                farmacia.fax = res.rows.item(i).fax;
                farmacia.latitud = res.rows.item(i).latitud;
                farmacia.longitud = res.rows.item(i).longitud;
                farmacia.starred = res.rows.item(i).starred;
                farmacia.opening = res.rows.item(i).opening;
                listadoFamacias.push(farmacia);
              }
              deferred.resolve(listadoFamacias);
            });
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Shows the menu with the starred farmacias.
       */
      getFavorites: function (c_fav, latitude, longitude) {
        var favoritesDeferred = Q.defer();
        var favoritos = [];

        var farmaciaIDs = c_fav.split("*");
        var farmaciasPromise = _.map(farmaciaIDs, function (idFarmacia) {
          var farmacyDeferred = Q.defer();

          getFarmaciaWithID(idFarmacia, latitude, longitude).then(function (
            farmacia
          ) {
            if (farmacia == null) {
              farmacyDeferred.resolve(null);
            }
            farmacyDeferred.resolve(farmacia);
          });

          return farmacyDeferred.promise;
        });

        Q.all(farmaciasPromise).then(function (farmaciasPrometidas) {
          farmaciasPrometidas = _.filter(farmaciasPrometidas, function (f) {
            return f != null;
          });
          favoritesDeferred.resolve(farmaciasPrometidas);
        });

        return favoritesDeferred.promise;
      },
      /**
       * Add a star to the specified farmacia so it become starred.
       * @param farmacia Object representing the farmacia to become starred.
       */
      addStar: function (farmacia) {
        var deferred = Q.defer();
        farmacia.starred = true;
        var sqlStatement = "";
        if (typeof farmacia.id == "undefined") {
          sqlStatement =
            "update farmacias set starred='1' where nombre = '%" +
            farmacia.nombre +
            "%';";
        } else {
          sqlStatement =
            "update farmacias set starred='1' where id='" + farmacia.id + "';";
        }

        db.transaction(
          function (tx) {
            tx.executeSql(sqlStatement, [], function (tx, res) {
              deferred.resolve();
            });
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       * Remove the star to the specified farmacia so it become unstarred.
       * @param farmacia Object representing the farmacia to become unstarred.
       */
      removeStar: function (farmacia) {
        var deferred = Q.defer();
        farmacia.starred = true;
        var sqlStatement = "";
        if (typeof farmacia.id == "undefined") {
          sqlStatement =
            "update farmacias set starred='0' where nombre = '" +
            farmacia.nombre +
            "';";
        } else {
          sqlStatement =
            "update farmacias set starred='0' where id='" + farmacia.id + "';";
        }

        db.transaction(
          function (tx) {
            tx.executeSql(sqlStatement, [], function (tx, res) {
              deferred.resolve();
            });
          },
          function (e) {
            console.log("ERROR: " + e.message);
          }
        );

        return deferred.promise;
      },
      /**
       *Tests the service functions
       */
      testDAO: function () {
        var dbManager = DataBaseManager();
        dbManager
          .getAnnotationsFarmaciasNearXY(
            43.307137,
            -1.988817,
            0.1,
            0.1,
            true,
            [64, 580, 949, 10]
          )
          .then(function (value) {});
        dbManager
          .getFamarciasNearXY(43.307137, -1.988817, 0.1, 0.1)
          .then(function (value) {});
        dbManager
          .getFarmaciasBarrio("CENTRO", 43.307137, -1.988817)
          .then(function (value) {});
        dbManager.getLocations().then(function (value) {});
        dbManager.getPueblosGipuzkoa().then(function (value) {});
        dbManager
          .getFarmaciasPueblo("IRUN", 43.307137, -1.988817)
          .then(function (value) {});
        getFarmaciaWithID(666, 43.333, -1.9222).then(
          function (result) {},
          function (error) {}
        );
        dbManager
          .getFarmaciasPuebloFilter("AZKOITIA", 4)
          .then(function (value) {});
        dbManager.getGuardZones().then(function (value) {});
        dbManager.getPrograms().then(function (value) {});
        dbManager.getFavorites().then(function (value) {});
        dbManager.getBarrios().then(function (value) {});
        dbManager.getNeighborhoods().then(function (value) {});
        pharmacyHasTheProgram(10, 4).then(function (result) {});
        pharmacyHasTheProgram(10, 5).then(function (result) {});
      },
      checkUpdateDDBB: checkUpdateDDBB,
    };
  }

  return {
    sharedInstance: function () {
      if (!instance) {
        instance = DataBaseManager();
      }
      return instance;
    },
  };
})();
