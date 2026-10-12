'use strict';

const path = require('path');
const { mkdirp } = require('mkdirp');

const nconf = nodebb.require('nconf');

const db = nodebb.require('./src/database');
const routeHelpers = nodebb.require('./src/routes/helpers');

const controllers = require('./lib/controllers');

const plugin = {
	embedRegex: /\[audio\/([\w\-_.]+)\]/g,
};
let app;

plugin.init = async function (params) {
	const { router, middleware } = params;

	app = params.app;

	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/audio-embed', controllers.renderAdminPage);

	const upload = nodebb.require('./src/middleware/multer');

	// Require a logged-in user and apply the same per-IP upload rate limit as
	// NodeBB's core upload routes. Without ensureLoggedIn this route accepts a
	// POST from any visitor who holds a CSRF token (which /api/config hands to
	// guests), so unauthenticated users could upload files; the privilege check
	// in controllers.upload further restricts it to accounts allowed to upload.
	router.post('/plugins/nodebb-plugin-audio-embed/upload', [
		middleware.ensureLoggedIn,
		upload.any(),
		middleware.validateFiles,
		middleware.uploads.ratelimit,
		middleware.applyCSRF,
	], routeHelpers.tryRoute(controllers.upload));

	await mkdirp(path.join(nconf.get('upload_path'), 'audio-embed'));
};

plugin.addAdminNavigation = function (header) {
	header.plugins.push({
		route: '/plugins/audio-embed',
		icon: 'fa-volume-up',
		name: 'Audio Embed',
	});
	return header;
};

plugin.registerFormatting = function (payload) {
	payload.options.push({
		name: 'audio-embed',
		className: 'fa fa-file-audio-o',
		title: 'Embed Audio',
	});
	return payload;
};

plugin.parsePost = async function (data) {
	if (!data || !data.postData || !data.postData.content) {
		return data;
	}

	data.postData.content = await plugin.parseRaw(data.postData.content);
	return data;
};

plugin.parseRaw = async function (content) {
	const matches = [...new Set(content.match(plugin.embedRegex) || [])]
		.map(match => match.slice(7, -1));

	if (!matches.length) {
		return content;
	}

	const existence = await db.isSortedSetMembers('audio-embed:date', matches);
	const ids = matches.filter((id, index) => existence[index]);

	let parsedContent = content;
	const renderedEmbeds = await Promise.all(ids.map(async id => ({
		id,
		html: await app.renderAsync('partials/audio-embed', {
			id,
			path: path.join(nconf.get('relative_path'), '/uploads/audio-embed', id),
		}),
	})));

	for (const { id, html } of renderedEmbeds) {
		parsedContent = parsedContent.replace(`[audio/${id}]`, html);
	}

	return parsedContent;
};

plugin.exists = async function (id) {
	return await db.isSortedSetMember('audio-embed:date', id);
};

module.exports = plugin;
