'use strict';

const fs = require('fs').promises;
const path = require('path');

const nconf = nodebb.require('nconf');
const db = nodebb.require('./src/database');

const Controllers = module.exports;

Controllers.renderAdminPage = function (req, res) {
	res.render('admin/plugins/audio-embed', {
		title: 'Audio Embed',
	});
};

Controllers.upload = async function (req, res) {
	try {
		const payload = await processUpload(req.files[0]);
		res.json([{
			url: payload.id,
		}]);
	} catch (err) {
		res.status(400);
		res.json({
			error: err.message === 'invalid-file-type' ?
				'Invalid File Type Uploaded. Please check the file format or extension to ensure it is an audio file.' :
				err.message,
		});
	}
};

async function processUpload(payload) {
	if (!payload || !payload.path || !payload.name || !payload.size) {
		throw new Error('invalid-file');
	}
	if (!payload.type.startsWith('audio/')) {
		throw new Error('invalid-file-type');
	}

	const id = path.basename(payload.path);
	const uploadPath = path.join(nconf.get('upload_path'), 'audio-embed', id);

	await move(payload.path, uploadPath);
	await db.setObject('audio-embed:id:' + id, {
		name: payload.name,
		size: payload.size,
	});
	await db.sortedSetAdd('audio-embed:date', +new Date(), id);

	return {
		id: id,
	};
}

async function move(path, uploadPath) {
	try {
		await fs.rename(path, uploadPath);
	} catch (err) {
		if (err.code !== 'EXDEV') {
			throw err;
		}

		await fs.copyFile(path, uploadPath);
		await fs.unlink(path);
	}
}