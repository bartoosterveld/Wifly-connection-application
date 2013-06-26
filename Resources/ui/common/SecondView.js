//This screen is for showing the available Wifly's. It listens for the Wifly broadcast

function SecondView() {
	//require udp module
var UDP = require('ti.udp');
var u = Ti.Android != undefined ? 'dp' : 0;
var socketStarted = new Boolean();
var isUndefined = new Boolean();
var wiflyList = new Array();

////////declare Views////////
var self = Ti.UI.createView({
	layout:'vertical',
	backgroundColor: '#00c0ff'
});

var topView = Ti.UI.createView({
	layout:'composite',
	backgroundColor:'#00c0ff',
	width:'auto',
	height:'10%'
});

var midView = Ti.UI.createView({
	backgroundColor:'white',
	width:'auto',
	height:'80%'
});

var bottomView = Ti.UI.createView({
	layout:'horizontal',
	backgroundColor:'#00c0ff',
	width:'auto',
	height:'10%'
});

self.add(topView);
self.add(midView);
self.add(bottomView);
	
//////////UI//////////
//////////Topview//////////

var style;
if (Ti.Platform.name === 'iPhone OS'){
  style = Ti.UI.iPhone.ActivityIndicatorStyle.DARK;
}
else {
  style = Ti.UI.ActivityIndicatorStyle.DARK;
}

var statusIndicator = Ti.UI.createActivityIndicator({
	message:'searching Wifly',
  	style:style,
  	color:'white',
  	font: { fontSize:15,fontFamily:'Helvitica Neue' },
  	height:Ti.UI.SIZE,
  	width:Ti.UI.SIZE
});	

var noWifly = Ti.UI.createLabel({
	font: { fontSize:15,fontFamily:'Helvitica Neue' },
	text:'No Wifly found',
	color:'red'
});

topView.add(statusIndicator);
statusIndicator.show();

//////////midView//////////

	//tableSection
var tableSection = Ti.UI.createTableViewSection({
	headerTitle: "Wifly's",
});
	
	//Table View
var table = Ti.UI.createTableView({
	height:'100%',
	data: [tableSection]
});

table.addEventListener('click', function(e) {
	if(socketStarted){
	socket.stop();
	}
	
	var indexN = e.index;
	var ipAddress = wiflyList[indexN].split(":");
		Ti.API.info("ip "+ipAddress[1]);
		Ti.API.info("port "+ipAddress[2]);
	
	self.fireEvent('itemSelected', {
		info:'one',
		ip: ipAddress[1],
		port: ipAddress[2]
	});
	
});
	
midView.add(table);
//////////bottomView/////////
var back = Ti.UI.createButton({
	font: { fontSize:15,fontFamily:'Helvitica Neue' },
	title:'back',
	height:35,
	top:'10%',
	left:10,
	width:'auto'
});

var all = Ti.UI.createButton({
	font: { fontSize:15,fontFamily:'Helvitica Neue' },
	title:'use all',
	height:35,
	top:'10%',
	left:10,
	width:'auto'
});

bottomView.add(back);
	
back.addEventListener('click', function(e){
	socket.stop();
	self.fireEvent('back', {});
});
//////////background tasks//////////

var checkAddress = new Array();
	checkAddress[0] = 'start';
	
var btnPressed = new Boolean();
	btnPressed = false;
	
	//start socket
var socket = UDP.createSocket();
socket.start({
	port: 55555
});
socketStarted=true;

socket.addEventListener('data', function (evt) {
   	var broadcast = JSON.stringify(evt);
   	Ti.API.info(broadcast);
	listWifly(broadcast);	
});

setTimeout(function(){
	topView.remove(statusIndicator)
	socket.stop()
	socketStarted=false;
	if(tableSection.rowCount < 1){
			topView.add(noWifly);
		}
},15000);

//////////functions//////////


function listWifly(e){
		if(e == !null || !undefined){
		
		var splitE = e.split(',');
		var storeAddress;
		var storeName;
		var nameAr;
		var same = new Boolean();
		same = false;
		
		
		for(var i=0;i<splitE.length;i++){
			if(splitE[i].match('address')){
			 		storeAddress = splitE[i];
				}
			if(splitE[i].match('stringData')){
					nameAr = splitE[i];
				}
		};
			
		var splitName = nameAr.split('\\');
			for(var i=0;i<splitName.length;i++){
				if(splitName[i].match('wifly')){
					storeName = splitName[i];
			}
			};
	for(var i = 0;i<checkAddress.length;i++){
		if(checkAddress[i] === storeAddress ){
			same = true;
			}
	};
	if(!same){
			ipAddress = adWifly(storeName, storeAddress);
			checkAddress.push(storeAddress)
		}
		
	if(checkAddress.length > 2){
		if(!btnPressed){
			
		bottomView.add(all);
		btnPressed = true;
		
		all.addEventListener('click', function(e){
			for(var i=0;i<checkAddress.length;i++){
				Ti.API.info('check '+checkAddress[i]);
			};
			
			self.fireEvent('itemSelected', {
				info:'all',
				ip:checkAddress
			});
		
		});
	}}
	}
	} //end listWifly function
	
	//function for adding the wifly to table
	function adWifly(n,a){
		if(n == !null || !undefined){
		var str = n.slice(3);
		var strIp = a.replace(/"/g,'');
		
		wiflyList.push(strIp);
		
		var lbl = Ti.UI.createLabel({
			text: str + '\n' + strIp,
			font: { fontSize:15,fontFamily:'Helvitica Neue' }
		});
		
		var row = Ti.UI.createTableViewRow();
		row.add(lbl);
		tableSection.add(row);
		table.data = [tableSection];
		}
	}// end adWifly
	
return self;
}

module.exports = SecondView;