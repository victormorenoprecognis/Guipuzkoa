<?php
try {
	/*** connect to SQLite database ***/
	$dbh = new PDO("sqlite:farmacias.db");
    echo "Handle has been created ...... <br><br>";
} catch(PDOException $e) {
	echo $e->getMessage();
	echo "<br><br>Database -- NOT -- loaded successfully .. ";
    die( "<br><br>Query Closed !!! $error");
}
echo "Database loaded successfully ....";

$url = "http://api.batura.mobi/cofgipuzkoa/ws/cofg_ws.php?op=getNexttome&userLat=43.18&userLng=-2.50&distance=40&showAll=1";
$json = file_get_contents($url);
$array = json_decode($json,true);
print_r_html($array);

foreach($array as $key=>$value) {
	$id = $value['id'];
	$x = $value['gps_coordx'];
	$y = $value['gps_coordy'];
	$opening = $value['opening'];
	
	echo $id . ' :: ' . $opening .  ' :: ' . $x . '<br>';
	$dbh->query("UPDATE farmacias SET opening = '$opening' WHERE longitud = '$y' AND latitud = '$x'");
}

function print_r_html($arr){
	echo '<pre>';
	print_r($arr);
	echo '</pre>';
}

