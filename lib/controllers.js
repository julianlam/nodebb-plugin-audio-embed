'use strict';

var Controllers = {};

Controllers.renderAdminPage = function (req, res, next) {
	res.render('admin/plugins/audio-embed', {});
};

Controllers.upload = function(req, res, next) {
	var main = module.parent.exports;

	main.processUpload(req.files.files[0], function(err, payload) {
		if (!err) {
			res.json([{
				url: payload.id
			}]);
		} else {
			res.json({
				error: err.message === 'invalid-file-type' ? 'Invalid File Type Uploaded. Please check the file format or extension to ensure it is an audio file.' : 'An unknown error occured'
			});
		}
	});
};

module.exports = Controllers;