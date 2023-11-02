<?php
$PROGRAMS_ADMITTED_SQL = "('2','3','4')";
$PROGRAMS_ADMITTED_ID = array(2 => 'GIB-SIFILIS Testa', 3 => 'Metadona', 4 => 'Etxez etxeko laguntza');
// securize from app

function getPharmaciesTimetables($token)
{
	$myHeaders = ["Authorization: bearer " . $token];
	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_horariohabituals';

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $baseURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);
	if (curl_errno($ch)) {
		throw new Exception('Curl Error: ' . curl_error($ch));
	}
	curl_close($ch);

	$responseArray = json_decode($response, true);

	$allPharmaciesTimetables = [];

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];

		foreach ($valueArray as $item) {
			$pharmacyDataObject = [
				'pharmacyID' => $item['_tgl_farmaciaid_value'],
				'open_time' => $item['tgl_aperturatxt'],
				'close_time' => $item['tgl_cierretxt'],
			];
			$allPharmaciesTimetables[] = $pharmacyDataObject;
			// array unique redux pattern
		}
		return $allPharmaciesTimetables;
	} else {
		throw new Exception("No 'value' array found in the JSON response.");
	}
}


function getAuthToken()
{
	$url = "https://login.microsoftonline.com/51451491-acc5-437c-b33d-3ea27fe34727/oauth2/token";
	$client_id = "fbed6822-6c2d-4b42-9f34-6ee7171dd6a9";
	$resource = "https://cofg.crm4.dynamics.com/";
	$client_secret = "o8W8Q~gz.thEWVy6tmXpGO1ky2Ie~qf3RkQzfay5";
	$grant_type = "client_credentials";

	$data = [
		"client_id" => $client_id,
		"resource" => $resource,
		"client_secret" => $client_secret,
		"grant_type" => $grant_type
	];

	$ch = curl_init($url);

	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	$response = curl_exec($ch);
	curl_close($ch);

	$data = json_decode($response, true);

	if (isset($data['access_token'])) {
		return $data['access_token'];
	} else {
		throw new Exception("Failed to obtain access token.");
	}
}

// Function to get neighborhoods
function getNeighborhoods($token)
{
	$myHeaders = ["Authorization: bearer " . $token];
	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_barrios';

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $baseURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);
	if (curl_errno($ch)) {
		throw new Exception('Curl Error: ' . curl_error($ch));
	}
	curl_close($ch);

	$responseArray = json_decode($response, true);

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];
		$gipuzkoaNeighbourhoodsValues = [];

		foreach ($valueArray as $item) {
			$neighbourhoodsObject = [
				'name' => ucwords(mb_strtolower($item['tgl_barrio'])),
				'neighbourhoods_id' => $item['tgl_barrioid'],
			];
			$gipuzkoaNeighbourhoodsValues[] = $neighbourhoodsObject;
		}

		return $gipuzkoaNeighbourhoodsValues;
	} else {
		throw new Exception("No 'value' array found in the JSON response.");
	}
}

function getAllPharmacies($token)
{
	$pharmaciesTimetables = getPharmaciesTimetables($token);
	$guardPharmaciesTimetable = getGuardPharmaciesTimetable($token);


	$myHeaders = [
		"Authorization: bearer " . $token
	];

	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/accounts';
	$queryParams = [
		'$filter' => "statuscode eq 288710003 and _tgl_tipoentidadid_value eq dd880fce-8925-eb11-a813-000d3ab9b331"
	];

	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);

	if (curl_errno($ch)) {
		throw new Exception('Curl Error: ' . curl_error($ch));
	}

	curl_close($ch);

	$responseArray = json_decode($response, true);
	$allPharmacies = [];

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];

		foreach ($valueArray as $item) {
			if ($item['tgl_latitud'] || $item['tgl_longitud']) {
				$pharmacyDataObject = [
					'id' => $item['accountid'],
					'name' => $item['name'],
					'address_num' => $item['tgl_direccion'],
					'telephone' => $item['tgl_telefono'],
					'address_name' => $item['tgl_poblacion'],
					'location' => $item['tgl_poblacion'],
					'gps_coordx' => $item['tgl_longitud'],
					'gps_coordy' => $item['tgl_latitud'],
					'email' => $item['tgl_email'],
					'status' => getPharStatus($item['accountid'], $pharmaciesTimetables, $token, $guardPharmaciesTimetable),
					'fax' => $item['fax'],
					'opening' => null,
					'openingS' => null,
					'openingD' => null,
					// 'statusB' => getPharmacyGuardTime($item['accountid'], $token)
				];
				$allPharmacies[] = $pharmacyDataObject;
			}
		}

		return $allPharmacies;
	} else {
		throw new Exception("No 'value' array found in the JSON response.");
	}
}

function getPharmacyGuardTime($pharId, $token)
{

	if (empty($pharTimetable)) {
		return 'empty';
		$pharTimetable = getPharmacyTimetable($pharId, $token);
	} else {
		return null;
	}
	return $pharTimetable;
}


function getObjectsWithUniqueNames($array)
{
	$uniqueNames = [];
	$resultArray = [];

	foreach ($array as $item) {
		$name = $item["name"];
		if (!in_array($name, $uniqueNames)) {
			$uniqueNames[] = $name;
			$resultArray[] = $item; // Add the whole object to the result
		}
	}

	return $resultArray; // Return the array of objects with unique "name" values
}

// Function to obtain all locations
function getLocations($token)
{
	$myHeaders = [
		"Authorization: bearer " . $token
	];


	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_codpostals';
	$queryParams = [
		'$filter' => '_tgl_provincia_value eq 93ee892c-a150-e911-a835-000d3a289db7',
		'$orderby' => 'tgl_poblacion'
	];

	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);

	if (curl_errno($ch)) {
		throw new Exception('Curl Error: ' . curl_error($ch));
	}

	curl_close($ch);

	// Step 1: Detect the encoding and convert to UTF-8
	$encoding = mb_detect_encoding($response, 'UTF-8, ISO-8859-1', true);

	if ($encoding !== 'UTF-8') {
		$response = mb_convert_encoding($response, 'UTF-8', $encoding);
	}

	// Step 2: Remove any invalid UTF-8 characters
	// $response = preg_replace('/[^\x{0000}-\x{10FFFF}]/u', '', $response);

	// Step 3: Now you can safely decode the JSON
	$responseArray = json_decode($response, true);


	// Check if JSON decoding was successful
	if (json_last_error() === JSON_ERROR_NONE) {
		// JSON decoded successfully
		// $responseArray now contains the decoded data
	} else {
		// JSON decoding failed
		throw new Exception('JSON Decoding Error: ' . json_last_error_msg());
	}
	$allLocations = [];

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];

		foreach ($valueArray as $item) {
			if (isset($item['tgl_poblacion'])) {
				$locationObject = [
					'name' => ucwords(mb_strtolower($item['tgl_poblacion'])),
					'townId' => $item['tgl_codpostalid'],
				];
				$allLocations[] = $locationObject;
			}
		}
		$uniqueNames = getObjectsWithUniqueNames($allLocations);

		return $uniqueNames;
	} else {
		throw new Exception("No 'value' array found in the JSON response.");
	}
}


// $lang, $month, $day, $guardtime, $guardzone, $userLat, $userLng, $token
// Function to get pharmacies by town
function getPharmaciesByTown($lang, $location, $neighborhood, $userLat, $userLng, $program, $token)
{
	$pharmaciesTimetables = getPharmaciesTimetables($token);
	$guardPharmaciesTimetable = getGuardPharmaciesTimetable($token);

	$myHeaders = [
		"Authorization: bearer " . $token
	];

	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/accounts';
	$queryParams = [
		'$filter' => "statuscode eq 288710003 and _tgl_tipoentidadid_value eq dd880fce-8925-eb11-a813-000d3ab9b331 and tgl_poblacion eq '$location'"
	];

	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);

	if (curl_errno($ch)) {
		throw new Exception('Curl Error: ' . curl_error($ch));
	}

	curl_close($ch);

	$responseArray = json_decode($response, true);
	$pharmaciesFromNeighborhood = [];

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];

		foreach ($valueArray as $item) {
			$pharTimetable = getPharmacyTimetable($item['accountid'], $token);
			$neighborhoodPharmacyObject = [
				'id' => $item['accountid'],
				'name' => $item['name'],
				'address_num' => $item['tgl_direccion'],
				'telephone' => $item['tgl_telefono'],
				'address_name' => $item['tgl_poblacion'],
				'location' => $item['tgl_poblacion'],
				'gps_coordx' => $item['tgl_longitud'],
				'gps_coordy' => $item['tgl_latitud'],
				'email' => $item['tgl_email'],
				'status' => getPharStatus($item['accountid'], $pharmaciesTimetables, $token, $guardPharmaciesTimetable),
				'fax' => $item['fax'],
				'programs' => getPharProgramsByPharId($item['accountid'], $token),
				'opening' => $pharTimetable['L'],
				'openingS' => $pharTimetable['S'],
				'openingD' => $pharTimetable['D'],
			];
			$pharmaciesFromNeighborhood[] = $neighborhoodPharmacyObject;
		}
	} else {
		throw new Exception("No 'value' array found in the JSON response.");
	}

	return $pharmaciesFromNeighborhood ?: null;
}

/**
 * Returns all the pharmacies for the specified location or neighbourhood. If no location or
 * neighbourhood is specified all pharmacies will be returned. If userLat and userLng  are specified
 * distance to the pharmacies will be added to the result.
 * @param location / Location whose pharmacies we want to get.
 * @param neighborhood / Neighbourhood whose pharmacies we want to get.
 * @param userLat / Current latitude of the user. Default is null.
 * @param userLng / Current longitude of the user. Default is null.
 * @param programs / Pharmacy programs we want to get.
 * @param joinTimeFields / Boolean specifying if times should be returned joined or in separated fields. Default is true.
 * @return List of pharmacies with id, name, town, street name, street number, phone number, fax, morning open time, morning close time, afternoon open time, afternoon close time and distance (only if user position specified). 
 */

// Function to get pharmacies
function getPharmacies($neighborhood, $token)
{
	$filterStr = "statuscode eq 288710003 and _tgl_tipoentidadid_value eq dd880fce-8925-eb11-a813-000d3ab9b331 and _tgl_barrioid_value eq $neighborhood";
	$pharmaciesTimetables = getPharmaciesTimetables($token);
	$guardPharmaciesTimetable = getGuardPharmaciesTimetable($token);

	$myHeaders = [
		"Authorization: bearer " . $token
	];

	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/accounts';
	$queryParams = [
		'$filter' => $filterStr
	];

	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);

	if (curl_errno($ch)) {
		throw new Exception('Curl Error: ' . curl_error($ch));
	}

	curl_close($ch);

	// Step 1: Detect the encoding and convert to UTF-8
	$encoding = mb_detect_encoding($response, 'UTF-8, ISO-8859-1', true);

	if ($encoding !== 'UTF-8') {
		$response = mb_convert_encoding($response, 'UTF-8', $encoding);
	}

	// Step 2: Remove any invalid UTF-8 characters
	$response = preg_replace('/[^\x{0000}-\x{10FFFF}]/u', '', $response);

	// Step 3: Now you can safely decode the JSON
	$responseArray = json_decode($response, true);

	// Check if JSON decoding was successful
	if (json_last_error() === JSON_ERROR_NONE) {
		// JSON decoded successfully
		// $responseArray now contains the decoded data
	} else {
		// JSON decoding failed
		throw new Exception('JSON Decoding Error: ' . json_last_error_msg());
	}

	// $responseArray = json_decode($response, true);
	$pharmaciesFromNeighborhood = [];

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];

		foreach ($valueArray as $item) {
			$pharTimetable = getPharmacyTimetable($item['accountid'], $token);
			$neighborhoodPharmacyObject = [
				'id' => $item['accountid'],
				'name' => $item['name'],
				'address_num' => $item['tgl_direccion'],
				'telephone' => $item['tgl_telefono'],
				'address_name' => $item['tgl_poblacion'],
				'location' => $item['tgl_poblacion'],
				'gps_coordx' => $item['tgl_longitud'],
				'gps_coordy' => $item['tgl_latitud'],
				'email' => $item['tgl_email'],
				'status' => getPharStatus($item['accountid'], $pharmaciesTimetables, $token, $guardPharmaciesTimetable),
				'fax' => $item['fax'],
				'programs' => getPharProgramsByPharId($item['accountid'], $token),
				'opening' => $pharTimetable['L'],
				'openingS' => $pharTimetable['S'],
				'openingD' => $pharTimetable['D'],
			];
			$pharmaciesFromNeighborhood[] = $neighborhoodPharmacyObject;
		}
	} else {
		return null;
		// throw new Exception("No 'value' array found in the JSON response.");
	}

	return $pharmaciesFromNeighborhood ?: null;
}

// Function to get pharmacy programs by pharmacy ID
function getPharProgramsByPharId($pharId, $token)
{
	$str = "_tgl_accountid_value eq " . $pharId;

	$myHeaders = [
		"Authorization: bearer " . $token
	];
	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_programasanitarioadscritos';
	$queryParams = [
		'$filter' => $str
	];

	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);

	if (curl_errno($ch)) {
		throw new Exception('Curl Error: ' . curl_error($ch));
	}

	curl_close($ch);
	$pharmacyPrograms = null;
	$responseArray = json_decode($response, true);

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];
		$pharmacyPrograms = [];

		foreach ($valueArray as $item) {
			$parts = explode(" - ", $item['tgl_name']);
			$programName = ucwords(mb_strtolower($parts[0]));
			$pharmacyPrograms[] = $programName;
		}
	}

	return $pharmacyPrograms;
}

// Function to get pharmacy data by pharmacy ID
function getPharmacyDataByPharId($pharID, $token)
{
	$pharmaciesTimetables = getPharmaciesTimetables($token);
	$guardPharmaciesTimetable = getGuardPharmaciesTimetable($token);


	$myHeaders = [
		"Authorization: bearer " . $token
	];
	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/accounts';
	$queryParams = [
		'$filter' => "_tgl_tipoentidadid_value eq dd880fce-8925-eb11-a813-000d3ab9b331 and accountid eq " . $pharID
	];

	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);

	if (curl_errno($ch)) {
		throw new Exception('Curl Error: ' . curl_error($ch));
	}

	curl_close($ch);

	$responseArray = json_decode($response, true);
	$neihboourhoodPharmaciesObject = null;

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];

		foreach ($valueArray as $item) {
			$pharTimetable = getPharmacyTimetable($item['accountid'], $token);
			$neihboourhoodPharmaciesObject = [
				'id' => $item['accountid'],
				'name' => $item['name'],
				'address_num' => $item['tgl_direccion'],
				'telephone' => $item['tgl_telefono'],
				'address_name' => $item['tgl_poblacion'],
				'location' => $item['tgl_poblacion'],
				'gps_coordx' => $item['tgl_longitud'],
				'gps_coordy' => $item['tgl_latitud'],
				'email' => $item['tgl_email'],
				'status' => getPharStatus($item['accountid'], $pharmaciesTimetables, $token, $guardPharmaciesTimetable),
				'fax' => $item['fax'],
				'programs' => getPharProgramsByPharId($item['accountid'], $token),
				'opening' => $pharTimetable['L'],
				'openingS' => $pharTimetable['S'],
				'openingD' => $pharTimetable['D'],
			];
		}
	} else {
		throw new Exception("No 'value' array found in the JSON response.");
	}

	return $neihboourhoodPharmaciesObject;
}

/**
 * Funcion te devuelva los idTurnoGuardia y el NombreDelasGUardias(municipios)
 */

// Function to get guard zones
function getGuardZones($token)
{
	$myHeaders = [
		"Authorization: bearer " . $token
	];
	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_zonaguardias';

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $baseURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);

	if (curl_errno($ch)) {
		throw new Exception('Curl Error: ' . curl_error($ch));
	}

	curl_close($ch);

	$responseArray = json_decode($response, true);
	$guardZonesArray = [];

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];

		foreach ($valueArray as $item) {
			$townObject = [
				'name' => $item['tgl_name'],
				'idZoneGuard' => $item['tgl_zonaguardiaid'],
			];
			$guardZonesArray[] = $townObject;
		}
	} else {
		throw new Exception("No 'value' array found in the JSON response.");
	}

	return $guardZonesArray;
}

function getPharmaciesGuard($lang, $month, $day, $guardtime, $guardzone, $userLat = null, $userLng = null, $token)
{
	$year = date('Y');
	$startTime = $year . "-" . normalizeMonths($month) . "-" . normalizeDays($day) . "T06:59:59Z";
	$endTime = $year . "-" . normalizeMonths($month) . "-" . normalizeDays($day) . "T22:00:01Z";

	$endTimeFIX = $year . "-" . normalizeMonths($month) . "-" . normalizeDays($day) . "T22:00:00Z";

	if ($guardtime == 0) {
		$filterStr = 'statuscode eq 288710000 and tgl_horaapertura gt ' . $startTime . ' and tgl_horacierre lt ' . $endTime .
			' and _tgl_zonaguardia_value eq ' . $guardzone;
	} elseif ($guardtime == 1) {
		$filterStr = 'statuscode eq 288710000 and tgl_horaapertura gt ' . $endTime . ' and tgl_fecha eq ' . $endTimeFIX . ' and _tgl_zonaguardia_value eq ' . $guardzone;
	}

	$myHeaders = [
		"Authorization: bearer " . $token
	];
	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_guardias';
	$queryParams = [
		'$filter' => $filterStr
	];
	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	// return $filterStr;
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);

	if (curl_errno($ch)) {
		throw new Exception('Curl Error: ' . curl_error($ch));
	}

	curl_close($ch);

	$responseArray = json_decode($response, true);
	$pharmaciesGuardOnGuardTime = null;

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];

		foreach ($valueArray as $item) {
			$pharmacyData = getPharmacyDataByPharId($item['_tgl_farmacia_value'], $token);

			$timestamp = strtotime($item['tgl_horaapertura']);
			$openTime = date("H:i", $timestamp);
			$timestamp = strtotime($item['tgl_horacierre']);
			$closeTime = date("H:i", $timestamp);

			$pharmacyData['guardOpening'] = $openTime;
			$pharmacyData['guardClosing'] = $closeTime;

			if (!empty($pharmacyData)) {
				$pharmaciesGuardOnGuardTime[] = $pharmacyData;
			}
		}
	} else {
		return null;
	}

	return $pharmaciesGuardOnGuardTime;
}

// Function to normalize Days

function normalizeDays($day)
{
	// Check if the input is a numeric value
	if (is_numeric($day)) {
		// Convert the day to an integer
		$day = (int) $day;

		// Add a leading zero if the day has only one digit
		if ($day < 10) {
			return '0' . $day;
		} else {
			return (string) $day;
		}
	} else {
		// If the input is not numeric, return an error message or handle it as needed
		return 'Invalid input';
	}
}

// Function to normalize months
function normalizeMonths($month)
{
	return str_pad($month, 2, '0', STR_PAD_LEFT);
}
// status being O (opened), C (closed) , V vacation, E ???
// 288710003 opened
function getPharStatus($accountId, $allPharmaciesTimetable, $token, $guardPharmaciesTimetable)
{
	$filteredPharTimetable = array_filter($allPharmaciesTimetable, function ($item) use ($accountId) {
		return $item["pharmacyID"] == $accountId;
	});
	date_default_timezone_set('Europe/Madrid'); // Replace 'Your/Timezone' with your desired timezone


	if (!empty($filteredPharTimetable)) {
		$filteredItem = reset($filteredPharTimetable);
		$openTime = strtotime($filteredItem["open_time"]);
		$openTimeInGMT = strtotime(date("Y-m-d H:i:s", $openTime));

		$closeTime = strtotime($filteredItem["close_time"]);
		$closeTimeInGMT = strtotime(date("Y-m-d H:i:s", $closeTime));
		$currentTimeTimestamp = time();

		if ($currentTimeTimestamp >= $openTimeInGMT && $currentTimeTimestamp <= $closeTimeInGMT) {
			return "O";
		} else {
			return checkIfPharmacyHasGuard($guardPharmaciesTimetable, $accountId);
		}
	} else {
		return false;
	}

}

function checkIfPharmacyHasGuard($guardPharmaciesTimetable, $accountId)
{


	$filteredGuardTimetable = array_filter($guardPharmaciesTimetable, function ($item) use ($accountId) {
		return $item["pharmacyID"] == $accountId;
	});


	if (!empty($filteredGuardTimetable)) {
		$filteredItem = reset($filteredGuardTimetable);
		$openTime = strtotime($filteredItem["open_time"]);
		$openTimeInGMT = strtotime(date("Y-m-d H:i:s", $openTime));

		$closeTime = strtotime($filteredItem["close_time"]);
		$closeTimeInGMT = strtotime(date("Y-m-d H:i:s", $closeTime));
		$currentTimeTimestamp = time();

		if ($currentTimeTimestamp >= $openTimeInGMT && $currentTimeTimestamp <= $closeTimeInGMT) {
			return "O";
		} else {
			return "C";
		}
	} else {
		return "C";
	}
}

function getGuardPharmaciesTimetable($token)
{
	$currentTime = date('H:i');
	$startTime1 = '00:00';
	$endTime1 = '09:00';

	$startTime2 = '09:00';
	$endTime2 = '22:00';

	$startTime3 = '22:00';
	$endTime3 = '09:00';

	$startTime1UTC = '19:59Z';
	$endTime1UTC = '07:01Z';

	$startTime2UTC = '06:59Z';
	$endTime2UTC = '20:01Z';

	$startTime3UTC = '19:59Z';
	$endTime3UTC = '07:01Z';

	$filterStr = "";

	if ($currentTime >= $startTime1 && $currentTime <= $endTime1) {
		$filterStr = "statuscode eq 288710000 and tgl_horaapertura gt " . date('Y-m-d', strtotime('yesterday')) . 'T' . $startTime1UTC . ' and tgl_horacierre lt ' . date('Y-m-d') . 'T' . $endTime1UTC;
	} else if ($currentTime >= $startTime2 && $currentTime <= $endTime2) {
		$filterStr = "statuscode eq 288710000 and tgl_horaapertura gt " . date('Y-m-d') . 'T' . $startTime2UTC . ' and tgl_horacierre lt ' . date('Y-m-d') . 'T' . $endTime2UTC;
	} else if ($currentTime >= $startTime3 && $currentTime <= $endTime3) {
		$filterStr = "statuscode eq 288710000 and tgl_horaapertura gt " . date('Y-m-d') . 'T' . $startTime3UTC . ' and tgl_horacierre lt ' . date('Y-m-d', strtotime('tomorrow')) . 'T' . $endTime3UTC;
	}

	$myHeaders = [
		"Authorization: bearer " . $token
	];

	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_guardias';

	$queryParams = [
		'$filter' => $filterStr
	];


	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	// return $filterStr;
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);
	if (curl_errno($ch)) {
		echo 'Error:' . curl_error($ch);
	}
	curl_close($ch);

	$responseArray = json_decode($response, true);
	$guardPharmaciesTimetable = [];

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];

		foreach ($valueArray as $item) {
			$pharmacyDataObject = [
				'pharmacyID' => $item['_tgl_farmacia_value'],
				'open_time' => $item['tgl_horaapertura'],
				'close_time' => $item['tgl_horacierre'],
			];
			$guardPharmaciesTimetable[] = $pharmacyDataObject;
		}
		return $guardPharmaciesTimetable;
	} else {
		return $guardPharmaciesTimetable;
	}
}

function getPharmacyTimetable($pharId, $token)
{
	$myHeaders = [
		"Authorization: bearer " . $token
	];
	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_horariohabituals';
	$queryParams = [
		'$filter' => "_tgl_farmaciaid_value eq " . $pharId
	];

	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);
	if (curl_errno($ch)) {
		echo 'Error:' . curl_error($ch);
	}
	curl_close($ch);

	$responseArray = json_decode($response, true);

	if (isset($responseArray['value'])) {
		$pharTimetable = [
			'L' => [],
			'S' => [],
			'D' => []
		];
		$valueArray = $responseArray['value'];

		foreach ($valueArray as $item) {
			switch ($item['tgl_dia']) {
				case 288710000:
					$pharTimetable['L'][] = $item['tgl_aperturatxt'] . "-" . $item['tgl_cierretxt'];
					break;
				case 288710001:
					$pharTimetable['S'][] = $item['tgl_aperturatxt'] . "-" . $item['tgl_cierretxt'];
					break;
				case 288710002:
					$pharTimetable['D'][] = $item['tgl_aperturatxt'] . "-" . $item['tgl_cierretxt'];
					break;
			}
		}
		return (!empty($pharTimetable)) ? $pharTimetable : null;
	} else {
		return null;
	}
}

/**
 * getPharmaciesState
 * @param ids list of ids separated by ","
 * @return {id,status},{id,status}, etc.. status being O (opened), C (closed)
 */
function getPharmaciesState($pharID, $token)
{
	$pharmaciesTimetables = getPharmaciesTimetables($token);
	$guardPharmaciesTimetable = getGuardPharmaciesTimetable($token);


	$myHeaders = [
		"Authorization: bearer " . $token
	];
	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/accounts';
	$queryParams = [
		'$filter' => "_tgl_tipoentidadid_value eq dd880fce-8925-eb11-a813-000d3ab9b331 and accountid eq " . $pharID
	];

	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);
	if (curl_errno($ch)) {
		echo 'Error:' . curl_error($ch);
	}
	curl_close($ch);

	$responseArray = json_decode($response, true);

	if (isset($responseArray['value'])) {
		$valueArray = $responseArray['value'];
		$pharDataStatus = null;

		foreach ($valueArray as $item) {
			$pharTimetable = getPharmacyTimetable($item['accountid'], $token);
			$pharDataStatus = [
				'id' => $item['accountid'],
				'name' => $item['name'],
				'address_num' => $item['tgl_direccion'],
				'telephone' => $item['tgl_telefono'],
				'address_name' => $item['tgl_poblacion'],
				'location' => $item['tgl_poblacion'],
				'gps_coordx' => $item['tgl_longitud'],
				'gps_coordy' => $item['tgl_latitud'],
				'email' => $item['tgl_email'],
				'status' => getPharStatus($item['accountid'], $pharmaciesTimetables, $token, $guardPharmaciesTimetable),
				'fax' => $item['fax'],
				'programs' => getPharProgramsByPharId($item['accountid'], $token),
				'opening' => $pharTimetable['L'],
				'openingS' => $pharTimetable['S'],
				'openingD' => $pharTimetable['D'],
			];
		}
		if (!empty($pharDataStatus)) {
			return $pharDataStatus;
		} else {
			echo "Pharmacy data not found.";
		}
	} else {
		echo "No 'value' array found in the JSON response.";
	}
	return null;
}

function getPrograms($town, $programType, $token)
{
	// TODO  : request more programs
	// $myHeaders = array(
	// 	"Authorization: bearer " . $token
	// );
	// $baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_programasanitarioadscritos';

	// $ch = curl_init();
	// curl_setopt($ch, CURLOPT_URL, $baseURL);
	// curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	// curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	// curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	// $response = curl_exec($ch);
	// if (curl_errno($ch)) {
	// 	echo 'Error:' . curl_error($ch);
	// }
	// curl_close($ch);

	$sanitaryPrograms = array();
	$sanitaryPrograms[] = 'Test vih-sifilis';
	$sanitaryPrograms[] = 'Metadona';
	$sanitaryPrograms[] = 'Ayuda domiciliaria';
	return $sanitaryPrograms;
}

/* Funcion dado un array  de idFArmacia, devuelve todos los datos de la farmacia*/
function getFavorites($arrayidPharm, $token)
{
	$pharmaciesTimetables = getPharmaciesTimetables($token);
	$guardPharmaciesTimetable = getGuardPharmaciesTimetable($token);
	$arraylist = explode("*", $arrayidPharm);
	$favsPharmaciesArray = [];

	foreach ($arraylist as $pharId) {
		$pharData = getPharmacyDataByPharId($pharId, $token);

		$pharTimetable = getPharmacyTimetable($pharId, $token);

		if ($pharData && $pharTimetable) {
			$favPharData = [
				'id' => $pharData['id'],
				'name' => $pharData['name'],
				'address_num' => $pharData['address_num'],
				'telephone' => $pharData['telephone'],
				'address_name' => $pharData['address_name'],
				'location' => $pharData['location'],
				'gps_coordx' => $pharData['gps_coordx'],
				'gps_coordy' => $pharData['gps_coordy'],
				'email' => $pharData['email'],
				'status' => getPharStatus($pharData['id'], $pharmaciesTimetables, $token, $guardPharmaciesTimetable),
				'fax' => $pharData['fax'],
				'programs' => getPharProgramsByPharId($pharData['id'], $token),
				'opening' => $pharTimetable['L'],
				'openingS' => $pharTimetable['S'],
				'openingD' => $pharTimetable['D'],
			];

			$favsPharmaciesArray[] = $favPharData;
		}
	}
	return $favsPharmaciesArray;
}


function getPharmaciesBySanitaryProgram($serviceType, $token)
{
	$sanitaryProgramValueID = null;
	switch ($serviceType) {
		case 0:
			// Sifilis
			$sanitaryProgramValueID = "c054badf-b27e-ec11-8d21-000d3a659f96";
			break;
		case 1:
			// Metadona
			$sanitaryProgramValueID = "c054badf-b27e-ec11-8d21-000d3a659f96";
			break;
		case 2:
			// Ayuda domiciliaria
			$sanitaryProgramValueID = "6df8355e-8925-eb11-a816-000d3ab9be86";
			break;
		default:
			// Handle other cases or return an error message if needed
			break;
	}

	if (!$sanitaryProgramValueID) {
		// Handle the case where $serviceType doesn't match any known values
		return false;
	}

	$myHeaders = ["Authorization: bearer " . $token];
	$filterStr = "_tgl_programasanitarioid_value eq " . $sanitaryProgramValueID;
	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_programasanitarioadscritos';
	$queryParams = ['$filter' => $filterStr];

	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);
	if (curl_errno($ch)) {
		echo 'Error:' . curl_error($ch);
	}
	curl_close($ch);

	$responseArray = json_decode($response, true);
	if (!empty($responseArray['value'])) {
		return $responseArray['value'];
	} else {
		return false;
	}
}

/*
 * Function to get the distinct programs from the database
 */
// "Test vih-sifilis" "_tgl_programasanitarioid_value": "c054badf-b27e-ec11-8d21-000d3a659f96",

// "Metadona" "_tgl_programasanitarioid_value":"0ac442ad-b27e-ec11-8d21-000d3a659f96
// "Ayuda domiciliaria""_tgl_programasanitarioid_value": "6df8355e-8925-eb11-a816-000d3ab9be86",

function getProgramsByTypeAndTown($town, $serviceType, $token)
{
	if (empty($town)) {
		$allPharmaciesWithSanitaryProgram = getPharmaciesBySanitaryProgram($serviceType, $token);
		$pharmaciesBySanitaryProgram = array();
		foreach ($allPharmaciesWithSanitaryProgram as $sanitaryProgramPhar) {
			if ($sanitaryProgramPhar['_tgl_accountid_value'] !== null) {
				$pharmaciesBySanitaryProgram[] = getPharmacyDataByPharId($sanitaryProgramPhar['_tgl_accountid_value'], $token);
			}
		}
		return (!empty($pharmaciesBySanitaryProgram)) ? $pharmaciesBySanitaryProgram : null;
	} else {
		$townPharmacies = getPharmaciesByTown(null, $town, null, null, null, null, $token);
		$pharmaciesByTownAndService = array();
		if ($townPharmacies) {
			foreach ($townPharmacies as $townPharmacydata) {
				$res = getSanitaryProgramByPharID($townPharmacydata['id'], $serviceType, $token);
				if ($res) {
					$pharmaciesByTownAndService[] = $townPharmacydata;
				}
			}
		}
		return (!empty($pharmaciesByTownAndService)) ? $pharmaciesByTownAndService : null;
	}
}

function getSanitaryProgramByPharID($pharID, $serviceType, $token)
{
	// Define an array to map service types to program IDs
	$programIDs = [
		0 => "c054badf-b27e-ec11-8d21-000d3a659f96",
		// sifilis
		1 => "c054badf-b27e-ec11-8d21-000d3a659f96",
		// metadona
		2 => "6df8355e-8925-eb11-a816-000d3ab9be86",
		// ayuda domiciliaria
		// Add more service types and their corresponding program IDs here if needed
	];

	// Check if the service type exists in the array, if not, return false
	if (!array_key_exists($serviceType, $programIDs)) {
		return false;
	}

	$programID = $programIDs[$serviceType];

	$myHeaders = [
		"Authorization: bearer " . $token
	];

	$str = "_tgl_programasanitarioid_value eq " . $programID . " and _tgl_accountid_value eq " . $pharID;
	$baseURL = 'https://cofg.api.crm4.dynamics.com/api/data/v9.2/tgl_programasanitarioadscritos';
	$queryParams = [
		'$filter' => $str
	];

	$encodedQuery = http_build_query($queryParams);
	$fullURL = $baseURL . '?' . $encodedQuery;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $fullURL);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $myHeaders);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

	$response = curl_exec($ch);
	if (curl_errno($ch)) {
		echo 'Error:' . curl_error($ch);
	}
	curl_close($ch);

	$responseArray = json_decode($response, true);

	return (!empty($responseArray['value']));
}
/*
 * Helper functions for Java version (Batuin).
 */

// Path to tmp and res directories for bxm.
define("PATH_TMP", "../../../tmp/cofgipuzkoa/");
define("PATH_RES", "../batuin/bxm/");

?>