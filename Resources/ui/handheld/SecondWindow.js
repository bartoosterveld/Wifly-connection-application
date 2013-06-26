function SecondWindow() {
	
	var SecondView = require('ui/common/SecondView');
		
	var self = Ti.UI.createWindow({
		backgroundColor:'#000'
	});
		
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

module.exports = SecondWindow;
