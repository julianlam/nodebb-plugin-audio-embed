'use strict';
/* globals $, app, socket, define */

define('admin/plugins/audio-embed', ['settings'], function(Settings) {

	var ACP = {};

	ACP.init = function() {
		Settings.load('audio-embed', $('.audio-embed-settings'));

		$('#save').on('click', function() {
			Settings.save('audio-embed', $('.audio-embed-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'audio-embed-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	};

	return ACP;
});