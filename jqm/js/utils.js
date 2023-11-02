/**
 * Get the number of days in a month
 * @param month
 * @param year
 */
function daysInMonth(month,year) {
	var m = [31,28,31,30,31,30,31,31,30,31,30,31];
	if (month != 2) return m[month - 1];
	if (year%4 != 0) return m[1];
	if (year%100 == 0 && year%400 != 0) return m[1];
	return m[1] + 1;
}
/**
 * Get url param from location
 * @param name
 * @returns
 */
function getURLParameter(name) {
	var value = (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1];
	if(value) return decodeURI(value)
	return null;
}
/**
 * Get url param from data-url attribute
 * @param name
 * @returns
 */
function getDataURLParameter($page, name) {
	var obj_pathUrl = $.mobile.path.parseUrl($page.jqmData("url"));
	var value = (RegExp(name + '=' + '(.+?)(&|$)').exec(obj_pathUrl.search)||[,null])[1];
	if(value) return decodeURI(value)
	return null;
}
/**
 * Emulate Java String.format function (params inside string must be {0}, {1},... not %d and %s)
 */
String.format = function ( )
{
	var s = arguments[ 0 ];
	if ( $.isArray( arguments[ 1 ] ) ) {
		for ( var i = 0, len = arguments[ 1 ].length; i < len; i++ ) {
			var reg = new RegExp("\\{" + i + "\\}", "gm");
			s = s.replace(reg, arguments[ 1 ][ i ]);
		}
	} else {
		for ( var i = 0, len = arguments.length - 1; i < len; i++ ) {
			var reg = new RegExp( "\\{" + i + "\\}", "gm" );
			s = s.replace(reg, arguments[ i+1 ]);
		}
	}
	return s;
};
/**
* Returns the type of the current device
*/
function deviceType()
{
	return (navigator.userAgent.match(/iPad/i))  == "iPad" ? "iPad" : (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iPhone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";
};