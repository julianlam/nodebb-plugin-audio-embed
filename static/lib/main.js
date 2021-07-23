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

	$(window).on('action:composer.loaded', function (ev, data) {
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

		if ($.Redactor) {
			$.Redactor.opts.plugins.push('audio-embed');
		}
	});

	$(window).on('action:redactor.load', function() {
		$.Redactor.prototype['audio-embed'] = function () {
			return {
				init: function () {
					var self = this;

					// require translator as such because it was undefined without it
					require(['translator'], function (translator) {
						translator.translate('Embed Audio', function (translated) {
							var button = self.button.add('audio-embed', translated);
							self.button.setIcon(button, '<i class="fa fa-file-audio-o"></i>');
							self.button.addCallback(button, self['audio-embed'].onClick);
						});
					});
				},
				onClick: function () {
					var self = this;
					upload(function (id) {
						require(['benchpress'], (Benchpress) => {
							Benchpress.parse('partials/audio-embed', {
								path: config.relative_path + '/uploads/audio-embed/' + id
							}, function (html) {
								self.insert.html(html);
							});
						});
					});
				}
			};
		};
	});
});