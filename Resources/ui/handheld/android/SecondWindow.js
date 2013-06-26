//Application Window Component Constructor
function SecondWindow() {
	
	//load component dependencies
	var SecondView = require('ui/common/SecondView');
		
	//create component instance
	var self = Ti.UI.createWindow({
		backgroundColor:'#fff',
		navBarHidden:true
	});
	//construct UI
	var secondView = new SecondView();
	self.add(secondView);
	
	secondView.addEventListener('back', function(e) {
		self.close();
	});
	
	secondView.addEventListener('itemSelected', function(e) {
		var Window;
		Window = require('ui/handheld/MenuWindow');
		Window(e).open();
	});
	
	return self;
}

//make constructor function the public component interface
module.exports = SecondWindow;
