<?php
	
	header("Access-Control-Allow-Origin: *");

	$myUri = $_SERVER['REQUEST_URI'];

	$uriWithParams = str_replace("/cofgipuzkoa/ws/ws.php?url=", "", $myUri);
	//$uriWithParams = $uriWithParams."?";

	foreach ($_POST as $key => $value) {
		$uriWithParams = $uriWithParams.htmlspecialchars($key)."=".htmlspecialchars($value)."&";	
	}

	$cont = file_get_contents($uriWithParams);

	echo $cont;

?>