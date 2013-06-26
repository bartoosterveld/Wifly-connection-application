//Application Window Component Constructor
function StartAppWindow(e) {
	var StartAppView = require('ui/common/StartAppView');
		
	//create component instance
	var self = Ti.UI.createWindow({
		backgroundColor:'#000'
	});
	
	//construct UI
	var startAppView = new StartAppView(e);
	self.add(startAppView);
	
	startAppView.addEventListener('back', function(e) {
		self.close();
	});
	
return self;
}

//make constructor function the public component interface
module.exports = StartAppWindow;