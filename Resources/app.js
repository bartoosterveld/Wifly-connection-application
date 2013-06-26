/*
 * Application for using your Wifly on your mobile device
 * 
 * tested on ipad 4th generation
 * 
 * function:
 * 	- Attaching your Wifly to your Home network
 * 	- Changing your Pincode
 * 	- Also usable in Ap mode
 * 	- supports multiple Wifly
 * 
 * Version: 2.6 BETA
 * 
 * By: Bart Oosterveld, student Art and Technology, Saxion highschool Enschede, Holland
 */


if (Ti.version < 1.8 ) {
	alert('Sorry - this application template requires Titanium Mobile SDK 1.8 or later');	  	
}

(function() {
	var osname = Ti.Platform.osname,
		version = Ti.Platform.version,
		height = Ti.Platform.displayCaps.platformHeight,
		width = Ti.Platform.displayCaps.platformWidth;
	
	var Window;
	
		if (osname === 'android') {
			Window = require('ui/handheld/android/ApplicationWindow');
		}
		else {
			Window = require('ui/handheld/ApplicationWindow');
		}
	
	new Window().open();
})();
