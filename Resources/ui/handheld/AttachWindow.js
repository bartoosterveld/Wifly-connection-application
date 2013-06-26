//Application Window Component Constructor
function AttachWindow(e) {
	
	//load component dependencies
	var AttachView = require('ui/common/AttachView');
		
	//create component instance
	var self = Ti.UI.createWindow({
		backgroundColor:'#000'
	});
		
	//construct UI
	var attachView = new AttachView(e);
	self.add(attachView);
	
	
	return self;
}

//make constructor function the public component interface
module.exports = AttachWindow;
