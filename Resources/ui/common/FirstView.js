//This view is for starting the application. Not much is going on here.
function FirstView() {
	
	var self = Ti.UI.createView({
		layout:'vertical',
		backgroundColor: '#00c0ff'
	});
	
	var label = Ti.UI.createLabel({
		color:'white',
		text:"Look for Wifly?",
		font: { fontSize:15,fontFamily:'Helvitica Neue' },
		height:'auto',
		width:'auto',
		top:'40%'
	});
	
	var btn = Ti.UI.createButton({
		title:'connect',
		height:35,
		width:'auto',
		font: { fontSize:15,fontFamily:'Helvitica Neue' },
		top:'10px'
	});
	
		
	self.add(label);
	self.add(btn);
	
	btn.addEventListener('click', function(e){
		self.fireEvent('start', {});
	});
	
	return self;
}

module.exports = FirstView;
