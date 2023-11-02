<?php
/*
 * Este archivo tratará las funciones creadas en funciones.php y las devolverá en formato json.
 */
require_once 'functions.php';

$function = $_REQUEST['op'];
switch ($function) {
	case 'getProgramsByTypeAndTown':
		echo getProgramsByTypeAndTownJSON($_REQUEST['town'], $_REQUEST['serviceType'], $_REQUEST['tok']);
		break;
	case 'getAllPharmacies':
		echo getAllPharmaciesJSON($_REQUEST['tok']);
		break;
	case 'getAuthToken':
		echo getAuthTokenJSON();
		break;
	case 'getLocations':
		echo getLocationsJSON($_REQUEST['tok']);
		break;
	case 'getNeighborhoods':
		echo getNeighborhoodsJSON($_REQUEST['tok']);
		break;
	case 'getPharmacies':
		echo getPharmaciesJSON($_REQUEST['nei'], $_REQUEST['tok']);
		break;
	case 'getPharmaciesState':
		if (!empty($_REQUEST['ids'] || $_REQUEST['tok']))
			echo getPharmaciesStateJSON($_REQUEST['ids'], $_REQUEST['tok']);
		break;
	case 'getGuardZones':
		echo getGuardZonesJSON($_REQUEST['tok']);
		break;
	case 'getPharmaciesByTown':
		echo getPharmaciesByTownJSON($_REQUEST['lang'], $_REQUEST['loc'], null, null, null, null, null, $_REQUEST['tok']);
		break;
	case 'getPharmaciesGuard':
		if (!empty($_REQUEST['month']) && !empty($_REQUEST['day']) && ($_REQUEST['guardtime'] == 0 || $_REQUEST['guardtime'] == 1) && !empty($_REQUEST['guardzone']))
			echo getPharmaciesGuardJSON((!empty($_REQUEST['lang'])) ? $_REQUEST['lang'] : 'es', $_REQUEST['month'], $_REQUEST['day'], $_REQUEST['guardtime'], $_REQUEST['guardzone'], $_REQUEST['userLat'], $_REQUEST['userLng'], $_REQUEST['tok']);
		break;
	case 'getFavorites':
		if (!empty($_REQUEST['arrayidPharm']))
			echo getFavoritesJSON($_REQUEST['arrayidPharm'], $_REQUEST['tok']);
		break;
	case 'getPrograms':
		echo getProgramsJSON($_REQUEST['town'], $_REQUEST['serviceType'], $_REQUEST['tok']);
		break;
}

function getProgramsByTypeAndTownJSON($town, $serviceType, $token)
{
	return correctEncoding(json_encode(getProgramsByTypeAndTown($town, $serviceType, $token)));
}
function getAuthTokenJSON()
{
	return correctEncoding(json_encode(getAuthToken()));
}

function getAllPharmaciesJSON($token)
{
	return correctEncoding(json_encode(getAllPharmacies($token)));
}
//Funcion que obtiene el array que devuelve la funcion getLOcation y lo devuelve en forma de Json
function getLocationsJSON($token)
{
	return correctEncoding(json_encode(getLocations($token)));
}
function getNeighborhoodsJSON($token)
{
	return correctEncoding(json_encode(getNeighborhoods($token)));
}

function getPharmaciesJSON($nei, $token)
{

	return correctEncoding(json_encode(getPharmacies($nei, $token)));
}
function getPharmaciesStateJSON($ids, $token)
{
	return correctEncoding(json_encode(getPharmaciesState($ids, $token)));
}
function getGuardZonesJSON($token)
{
	return correctEncoding(json_encode(getGuardZones($token)));
}

function getPharmaciesByTownJSON($lang, $month, $day, $guardtime, $guardzone, $userLat, $userLng, $token)
{
	return correctEncoding(json_encode(getPharmaciesByTown($lang, $month, $day, $guardtime, $guardzone, $userLat, $token)));
}

function getPharmaciesGuardJSON($lang, $month, $day, $guardtime, $guardzone, $userLat, $userLng, $token)
{
	return json_encode(getPharmaciesGuard($lang, $month, $day, $guardtime, $guardzone, $userLat, $userLng, $token));
}

function getFavoritesJSON($arrayidPharm, $token)
{
	return correctEncoding(json_encode(getFavorites($arrayidPharm, $token)));
}

function correctEncoding($text)
{
	return str_replace(array('\u00f1', '\u00d1'), array('ñ', 'Ñ'), $text);
}

function getProgramsJSON($town, $serviceType, $token)
{
	return correctEncoding(json_encode(getPrograms($town, $serviceType, $token)));
}
?>