//Application Window Component Constructor
function MenuWindow(e) {
	
	//load component dependencies
	var MenuView = require('ui/common/MenuView');
		
	//create component instance
	var self = Ti.UI.createWindow({
		backgroundColor:'#000'
	});
		
	//construct UI
	var menuView = new MenuView(e);
	self.add(menuView);
	
	menuView.addEventListener('back', function(e) {
		self.close();
	});
	
	menuView.addEventListener('attach', function(e) {
		var Window;
		Window = require('ui/handheld/AttachWindow');
		Window(e).open();
	});
	
	menuView.addEventListener('startApp', function(e) {
		var Window;
		Window = require('ui/handheld/StartAppWindow');
		Window(e).open();
	});
	
	
	return self;
}

//make constructor function the public component interface
module.exports = MenuWindow;
