Wifly-connection-application
============================

Mobile application for connecting mobile device to a Wifly module

This is a work in progress application for attaching a mobile device to a Roving Wifly module on a Arduino board.
Planned to work on both IOS and Android. For now only tested on iphone simulator and Ipad 4th Gen device.

Usable for:
- Attaching Wifly module to your home network
- Multiple Wifly devices
- Sending JSON messages to the Wifly
- TCP/IP connection
- Use Wifly in public rooms
- Pincode protection

Made by: Bart Oosterveld
Made with Appcelerator Titanium

Known Errors:
- Sometimes UDP or TCP communication is failing. When this happen you have to follow a couple of steps (only tested on IOS)
- install WiFlyClient app
- begin scanning
- open communication with your arduino
- type *something* and hit return
- on the next line remove the '>' sign and type *something* again and hit return
- now type *PN1234* assuming your pincode is PN1234.
- if you get PINOK message the app should work.

The code for handling multiple phones on one arduino is not finished

install notes:
- create a new classic default application in Appcelerator titanium
- replace the Resouces directory with the one in this git

