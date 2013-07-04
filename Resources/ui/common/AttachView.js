function AttachView(e) {
	//create object instance, a parasitic subclass of Observable
	
/////////global variables//////////
	var self = Ti.UI.createView({
		layout:'vertical',
		backgroundColor: '#00c0ff'
	});
	
	var ipAddress = e.ip,
		port = e.port,
		pinCode,
		splitScan,
		timeOut;
	
	var ssidArray = new Array();
	
	var closeSocket = new Boolean();
    	closeSocket = true;
    
	
	//////////UI//////////
	
///////////Declare Views///////////
	var topView = Ti.UI.createView({
		layout:'composite',
		backgroundColor:'#00c0ff',
		width:'auto',
		height:'10%'
	});

	var midView = Ti.UI.createView({
		layout:'composite',
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

//////////topView/////////
	var foundLbl = Ti.UI.createLabel({
		font: { fontSize:15,fontFamily:'Helvitica Neue' },
		width: 'auto',
       	height: 'auto',
       	top: 10,
       	color:'white'
	});
	var style;
        if (Ti.Platform.name === 'iPhone OS'){
            style = Ti.UI.iPhone.ActivityIndicatorStyle.DARK;
        }
        else {
            style = Ti.UI.ActivityIndicatorStyle.DARK;
        }
    var loadMessage = Ti.UI.createActivityIndicator({
        message:'scanning available networks',
        style:style,
        font: { fontSize:15,fontFamily:'Helvitica Neue' },
        height:Ti.UI.SIZE,
        width:Ti.UI.SIZE,
        color:'white'
    });
    
    var attaching = Ti.UI.createActivityIndicator({
        message:'attaching Wifly to home network',
        style:style,
        font: { fontSize:15,fontFamily:'Helvitica Neue' },
        height:Ti.UI.SIZE,
        width:Ti.UI.SIZE,
        color:'white'
    });
    
    topView.add(loadMessage);
    topView.add(attaching);
    loadMessage.show();

//////////midView//////////
	var tableSection = Ti.UI.createTableViewSection({
    	headerTitle: "select Home network",
    });

    var table = Ti.UI.createTableView({
        height:'100%',
        data: [tableSection]
    });
    
    var closeLbl = Ti.UI.createLabel({
    	text:'please close app, connect to home network trough settings. And start app again. Wifly should apear on search',
    	font: { fontSize:15,fontFamily:'Helvitica Neue' },
    	width: 'auto',
       	height: 'auto',
       	top: 10
    });
///////////bottomView////////////


/////////background tasks//////////
	var dialog = Ti.UI.createAlertDialog({
            title: 'Enter Pin (without PN!)',
            style: Ti.UI.iPhone.AlertDialogStyle.SECURE_TEXT_INPUT,
            buttonNames: ['OK', 'cancel']
        });
        
        dialog.addEventListener('click', function(e){
            pinCode = e.text;
            Ti.API.info(pinCode);
            startConnection(ipAddress,port,pinCode);
        });
     dialog.show();
      
/////////functions///////////
    
    function startConnection(i,h,p){
    	
    	var back = Ti.UI.createButton({
			font: { fontSize:15,fontFamily:'Helvitica Neue' },
			title:'cancel',
			height:35,
			top:'10%',
			left:10,
			width:'auto'
		});
		
		bottomView.add(back);
	
		back.addEventListener('click', function(e){
		clientSocket.close();
		stopTimer();
		self.fireEvent('back', {});
		});

    	
    	var timerCount = 20000;
    	
		
		table.addEventListener('click', function(e) {
			foundLbl.hide();
       		table.hide();
        		attaching.show();
        	
        	var indexN = e.index;
        	var ssidName = splitScan[indexN].split(",");
        
        var dialog = Ti.UI.createAlertDialog({
            title: 'Enter Password',
            style: Ti.UI.iPhone.AlertDialogStyle.SECURE_TEXT_INPUT,
            buttonNames: ['OK', 'cancel']
        });
        
        dialog.addEventListener('click', function(e){
            Ti.API.info(e.text);
       		 clientSocket.write(Ti.createBuffer({
            value:'set wlan phrase '+e.text+'\r'
        }));
        setTimeout(function(){
            clientSocket.write(Ti.createBuffer({
                value:'set wlan ssid '+ssidName[8]+'\r'
            }));
            setTimeout(function(){  
                clientSocket.write(Ti.createBuffer({
                    value:'save'+'\r'
                }));
                setTimeout(function(){
                	topView.remove(attaching);
                	
                 	midView.add(closeLbl);
                   
                    clientSocket.write(Ti.createBuffer({
                        value:'reboot'+'\r'
                    }));
                    
                    closeSocket = false;
                    },4000);
                    },4000);
                    },4000);
        });
        
        dialog.show();
   		});
    
    	var clientSocket = Ti.Network.Socket.createTCP({
            host: i,
            port: h,
            connected : function(e){
                Ti.API.info('connected!');
         			startTimer();
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
              	}else if (received.match('PINOK')){
              		
                  	Ti.API.info('pin ok!');
                   	sendValue = '$$$'
              	}else if(received.match('PINERR')){
              		stopTimer();
              		
              		var wrongPin = Ti.UI.createAlertDialog({
           				message: 'Returning to homescreen',
            			ok: 'ok',
            			title: 'wrong pincode'
        			});
        
        			wrongPin.addEventListener('click', function(e){
            			clientSocket.close();
            			self.fireEvent('back', {
            			});  			
                    });
                    
     				wrongPin.show();

                  	Ti.API.info('incorrect Pin');
              	}else if(received.match('CMD')){
              		
                  	sendValue = 'scan\r'
              	}else if(received.match('Found 0')){
              		
                 	sendValue = 'scan\r'
              	}else if(received.match('Found')){
              		
                  	chooseNet();
             	}
                    
       		function chooseNet(){
          		topView.remove(loadMessage);
               	if (received.match('END')){
                       splitScan = received.split("\n");
                            
                    	for(var i=0;i<splitScan.lenght;i++){
                        	Ti.API.info('splitschan= ' + splitScan[i]);
                      	};

                      	splitScan.shift();
                      	
                      	topView.add(foundLbl);
                      	foundLbl.text = splitScan[0];
             
	                   	midView.add(table);
                                
                     	splitScan.shift();
                     	splitScan.pop();
                      	splitScan.pop();
                            
                      	for(var i=0;i<splitScan.length;i++){
                           	var netName = splitScan[i].split(",")
                            
                            ssidArray.push(String(netName.lenght));

                            var lbl = Ti.UI.createLabel({
                                text: netName[netName.length-1],
                                font: { fontSize:20,fontFamily:'Helvitica Neue' }
                                });
        
                            var row = Ti.UI.createTableViewRow();
                                row.add(lbl);
                                tableSection.add(row);
                                table.data = [tableSection];
                            }
                            stopTimer();
                    }
                    }
      
                    
                Ti.API.info('Received: ' + received);
                
                clientSocket.write(Ti.createBuffer({
                         value:sendValue,
                }));
                
           } else {
                Ti.API.error('Error: read callback called with no buffer!');
                closeSocket = false;
                
                stopTimer();
              		
              		var connectionError = Ti.UI.createAlertDialog({
           				message: 'Returning to menu, RESTART WIFLY!',
            			ok: 'ok',
            			title: 'connection error'
        			});
        
        			connectionError.addEventListener('click', function(e){
            			self.fireEvent('back', {
            			});  			
                    });
                    
     				connectionError.show();
     				
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
        
        function startTimer(){
        	timeOut = setTimeout(function(){
					clientSocket.close();

              		var timeout = Ti.UI.createAlertDialog({
           				message: 'Returning to homescreen',
            			ok: 'ok',
            			title: 'timeout'
        			});
        
        			timeout.addEventListener('click', function(e){
            			self.fireEvent('back', {
            			});  			
                    });
                    
     				timeout.show();
			},timerCount);
        }
        function stopTimer(){
        	clearTimeout(timeOut);
        }
    }//end startConnection
    	

return self;
}

module.exports = AttachView;