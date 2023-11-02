/**
* Appcelerator Titanium Platform
* Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
**/
//math.js
//This file holds the basic math functions in regards to the augmented reality portion
//of the script. Reference from the Appcelerator Q&A section was also used.
var viewAngleX = ToRad(15); //This is an estimation of the total viewing angle that you see.
//Conversion of Degress to Radians
function ToRad(deg) {
	return deg * Math.PI/180;
}

//Conversion of Radians to Degrees
function ToDeg(rad) {
	return ((rad * 180/Math.PI) + 360) % 360;
}

//Reference for the functions below http://www.movable-type.co.uk/scripts/latlong.html
function Distance(UserLat, UserLon, pointLat, pointLong) {
    var R = 6371; // km
    
    var dLat = ToRad(pointLat-UserLat);
    var dLon = ToRad(pointLong-UserLon); 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(ToRad(UserLat)) * Math.cos(ToRad(pointLat)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(3);
}

function Bearing(UserLat, UserLon, pointLat, pointLong) {
  var lat1 = UserLat * Math.PI/180;
  var lat2 = pointLat * Math.PI/180;
  var dlng = (pointLong - UserLon) * Math.PI/180;

  var y = Math.sin(dlng) * Math.cos(lat2);
  var x = Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlng);
  var brng = Math.atan2(y, x);
  return brng;
}

//compute the X displacement from the center of the screen given
//the relative horizontal angle of a POI
function ComputeXDelta(relAngle) {
    var res = Math.sin(relAngle) / Math.sin(viewAngleX /2);
    return res;
}

//sortByDistance
function sortAssociativeArrayByDistance(a, b) {
    var x = a.dist;
    var y = b.dist;
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
}