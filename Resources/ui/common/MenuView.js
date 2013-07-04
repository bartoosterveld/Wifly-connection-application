function MenuView(e) {
	//create object instance, a parasitic subclass of Observable
	var self = Ti.UI.createView({
		layout:'vertical',
		backgroundColor: '#00c0ff'
	});
	
	var pinCode, newPinCode, newPin;

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
	
//////////topView//////////
	var menuLbl = Ti.UI.createLabel({
		font: { fontSize:15,fontFamily:'Helvitica Neue' },
		text:'Menu',
		color:'white'
	});
	
	topView.add(menuLbl);

//////////midView/////////

	var startAppBtn = Ti.UI.createButton({
		font: { fontSize:15,fontFamily:'Helvitica Neue' },
		title:'start application',
		height:35,
		top:'10%',
		width:'auto'
	});
	
	var attachBtn = Ti.UI.createButton({
		font: { fontSize:15,fontFamily:'Helvitica Neue' },
		title:'Attach to network',
		height:35,
		top:'10%',
		width:'auto'
	});
	
	var changePinBtn = Ti.UI.createButton({
		font: { fontSize:15,fontFamily:'Helvitica Neue' },
		title:'change pincode',
		height:35,
		top:'10%',
		width:'auto'
	});
	
/////////bottomView/////////
	var back = Ti.UI.createButton({
		font: { fontSize:15,fontFamily:'Helvitica Neue' },
		title:'back',
		height:35,
		top:'10%',
		left:10,
		width:'auto'
	});
	bottomView.add(back);
	
	back.addEventListener('click', function(e){
		self.fireEvent('back', {});
	});

//////////background tasks//////////
	chooseMenu(e);
	
/////////eventlisteners//////////
	
	
//////////functions//////////
	
	function chooseMenu(e){
		var n = e.info,
			i = e.ip,
			h = e.port;
		
		if(n === 'all'){
			allMenu(n,i);
		}else if(e.ip.match('1.2.3.4')){
			apModeMenu(n,i,h);
		}else{
			normalMenu(n,i,h);
		};
	}
	//diferent menu's
	function normalMenu(n,i,h){
		midView.add(changePinBtn);
		midView.add(startAppBtn);
		
		startAppBtn.addEventListener('click', function(e){
			startApp(n,i,h);
		});
		
		changePinBtn.addEventListener('click', function(e){
			changePin(n,i,h);
		});
	}
	function apModeMenu(n,i,h){
		midView.add(attachBtn);
		midView.add(changePinBtn);
		midView.add(startAppBtn);
		
		attachBtn.addEventListener('click', function(e){
			attachWifly(i,h);
		})
		
		startAppBtn.addEventListener('click', function(e){
			startApp(n,i,h);
		});
		
		changePinBtn.addEventListener('click', function(e){
			changePin(n,i,h);
		});
	}
	function allMenu(n,i){
		midView.add(startAppBtn);
		startAppBtn.addEventListener('click', function(e){
			startApp(n,i,'none');
		});
	}
	function attachWifly(i,h){
		self.fireEvent('attach',{
			ip: i,
			port: h
		});
	}
	function changePin(n,i,h){
		var dialog = Ti.UI.createAlertDialog({
            title: 'Enter old pin (without PN!)',
            style: Ti.UI.iPhone.AlertDialogStyle.PLAIN_TEXT_INPUT,
            buttonNames: ['OK', 'cancel']
        });
        
        dialog.addEventListener('click', function(e){
            pinCode = e.text;
            Ti.API.info(pinCode);
            startConnection(i,h,pinCode);
        });
     dialog.show();
        
	}//end function changepin
	function startApp(n,i,h){
		self.fireEvent('startApp', {
			info:n,
			ip:i,
			port:h
		});
	};
	
	function startConnection(i,h,p){
		var clientSocket = Ti.Network.Socket.createTCP({
            host: i,
            port: h,
            connected : function(e){
                Ti.API.info('connected!');
                Ti.Stream.pump(e.socket, pumpCallback, 1024, true);
                e.socket.write(Ti.createBuffer({
                    value:'Hello Wifly'
                }));
            },
            error: function(e){
                Ti.API.info('Error (' + e.errorCode + '): ' + e.error);
            }
        });//end socket creation
        function writeCallback(e) {
            Ti.API.info('Successfully wrote to socket.');
        }//end function writeCallback
        
        function pumpCallback(e) {
            var sendValue;
            if (e.bytesProcessed < 0) {
                Ti.API.info("Closing client socket.");
                clientSocket.close();
            return;
            }
            try {
                if(e.buffer) {
                    var received = e.buffer.toString();
                
                if(received.match('HELLO')){
                    sendValue = '*PN' + p + '*'
                }else if(received.match('PINOK')){
                	var dialog = Ti.UI.createAlertDialog({
           				title: 'Enter new pin (without PN!)',
            			style: Ti.UI.iPhone.AlertDialogStyle.PLAIN_TEXT_INPUT,
            			buttonNames: ['OK', 'cancel']
        			});
        
        			dialog.addEventListener('click', function(e){
            			newPinCode = e.text;
            			clientSocket.write(Ti.createBuffer({
                        	value:'*SPN' + newPinCode + '*'
                    	}));        			
                    });
     				dialog.show();
     			
                }else if(received.match('PINERR')){
                	alert('wrong pincode')
                	clientSocket.close();
                	return;
                }else if(received.match('PS')){
                	alert('passcode changed');
                	clientSocket.close();
                	return;
                }
                 Ti.API.info('Received: ' + received);
                clientSocket.write(Ti.createBuffer({
                         value:sendValue,
                }));
                
           } else {
                Ti.API.error('Error: read callback called with no buffer!');
                closeSocket = false;
                alert('connection failed, restart application');
            }
        } catch (ex) {
            Ti.API.error(ex);
        }
        }//end function pumpcallback
        
        clientSocket.connect();
        Ti.App.addEventListener('pause', function(){
        if(closeSocket){
            clientSocket.close();
        }
        });
	}//end function startConnection
	
return self;
}

module.exports = MenuView;