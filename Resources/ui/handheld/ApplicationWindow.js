//Application Window Component Constructor
function ApplicationWindow() {
	//load component dependencies
	var FirstView = require('ui/common/FirstView');
		
	//create component instance
	var self = Ti.UI.createWindow({
		backgroundColor:'#fff'
	});
		
	//construct UI
	var firstView = new FirstView();
	self.add(firstView);
	
	//EventListener for the start button
	firstView.addEventListener('start', function(e) {	
		var Window;
		Window = require('ui/handheld/SecondWindow');
		Window().open();
	});

	return self;
}

//make constructor function the public component interface
module.exports = ApplicationWindow;
