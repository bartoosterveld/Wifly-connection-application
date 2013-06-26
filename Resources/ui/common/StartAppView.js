function StartAppView(e) {

	var self = Ti.UI.createView({
		layout:'vertical',
		backgroundColor: '#00c0ff'
	});

	var socketStarted = new Boolean();
    socketStarted = true;
	
	var ipAddresses = new Array();
	var newport;
	
	var UDP = require('ti.udp');
	
	
	//////////UI//////////
	
///////////Declare Views///////////
	var topView = Ti.UI.createView({
		layout:'composite',
		backgroundColor:'#00c0ff',
		width:'auto',
		height:'10%'
	});

	var midView = Ti.UI.createView({
		layout:'vertical',
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
	
///////////mid view////////////
	var hlbl = Ti.UI.createLabel({
        top: 10,
        left: 10,
        text: 'hue:'
    });
    
    var slbl = Ti.UI.createLabel({
        top: 10,
        left: 10,
        text: 'saturation:'
    });
    
    var blbl = Ti.UI.createLabel({
        top: 10,
        left: 10,
        text: 'brightness:'
    });
    
    var hSlider = Ti.UI.createSlider({
        top: 10,
        min: 0,
        max: 359,
        width: '100%',
        value: 50
    });

    
    
    
    var sSlider = Ti.UI.createSlider({
        top: 10,
        min: 0,
        max: 100,
        width: '100%',
        value: 50
    });

    
    
    var bSlider = Ti.UI.createSlider({
        top: 10,
        min: 0,
        max: 100,
        width: '100%',
        value: 50
    });
    
//////////bottom view///////////
	var back = Ti.UI.createButton({
		font: { fontSize:15,fontFamily:'Helvitica Neue' },
		title:'back',
		height:35,
		top:'10%',
		left:10,
		width:'auto'
	});
	bottomView.add(back);
	
/////////background tasks//////////
	startSocket(e.info,e.ip,e.port);
		
//////////functions//////////
	function startSocket(t,i,h){
		
		back.addEventListener('click', function(e){
			if(socketStarted){
				socket.stop();
			}
			self.fireEvent('back', {});
		});
	
		var ipAddress = i;
		var port = h;
		
		if(t === 'all'){
			ipAddress.shift();
			for(var i=0;i<ipAddress.length;i++){
				var sliced = ipAddress[i].split(':');
				ipAddresses.push(sliced[1].slice(1));
				newport = sliced[2].slice(0,4);
			};
			
			Ti.API.info('hoist: '+newport)
			for(var i = 0;i<ipAddresses.length;i++){
				Ti.API.info('ipaddresseses '+ ipAddresses[i])
			}
			var socket = UDP.createSocket();
			socket.start({
				port: newport
			})
		}else{
			var socket = UDP.createSocket();
			socket.start({
				port: h
			})
		}
		
		var lightOn = {hue: Math.round(hSlider.value), sat: Math.round(sSlider.value), bri: Math.round(bSlider.value)}; 
    
    hSlider.addEventListener('change', function(e) {
        lightOn.hue = Math.round(e.value);
        if(socketStarted){
        sendValue();
        };
    });
    
    
    sSlider.addEventListener('change', function(e) {
        lightOn.sat = Math.round(e.value);
        if(socketStarted){
        sendValue();
        };
    });
    
    bSlider.addEventListener('change', function(e) {
        lightOn.bri = Math.round(e.value);
        if(socketStarted){
        sendValue();
        };
    });


    function sendValue(){
    
        json = JSON.stringify(lightOn);
        
        if(t==='one'){
            socket.sendString({
            host: ipAddress,
            data: json
        });
        }else{
        	for(var i=0;i<ipAddresses.length;i++){
        		socket.sendString({
        			host: ipAddresses[i],
        			data: json
        		});
        	}
        }

    };
    midView.add(hlbl);
    midView.add(hSlider);
    midView.add(slbl);
    midView.add(sSlider);
	midView.add(blbl);
	midView.add(bSlider);
	    
	}//end function startSocket
	
return self;
}

module.exports = StartAppView;