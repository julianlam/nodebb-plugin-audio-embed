"use strict";
/* globals $, require */

$(document).ready(function() {
	function upload(callback) {
		require(['uploader'], function (uploader) {
			uploader.show({
				title: 'Upload Audio',
				description: 'Upload an audio file for embedding into your post',
				route: config.relative_path + '/plugins/nodebb-plugin-audio-embed/upload'
			}, callback);
		});
	}

	$(window).on('action:app.load', function() {
		require(['composer/formatting', 'composer/controls'], function(formatting, controls) {
			if (formatting && controls) {
				formatting.addButtonDispatch('audio-embed', function(textarea, selectionStart, selectionEnd){
					upload(function (id) {
						controls.insertIntoTextarea(textarea, '[audio/' + id + ']');
						controls.updateTextareaSelection(textarea, id.length + 8, id.length + 8);
					});
				});
			}
		});
	});

	$(window).on('action:redactor.load', function() {
		$.Redactor.addButton('Embed Audio', 'fa-file-audio-o', function (redactor) {
			upload(function (id) {
				templates.parse('partials/audio-embed', {
					path: config.relative_path + '/uploads/audio-embed/' + id
				}, function (html) {
					redactor.insert.html(html);
				});
			});
		});
	});
});