const express = require('express');
const multer = require('multer');
const tnef = require('node-tnef');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/extract', upload.single('file'), (req, res) => {
	const buffer = req.file.buffer;

	tnef.parseBuffer(buffer, (err, content) => {
		if (err) {
			console.error('❌ TNEF parse error:', err);
			return res.status(500).json({ error: 'Failed to parse winmail.dat' });
		}

		if (!content || !content.Attachments || content.Attachments.length === 0) {
			return res.json({ html: '', attachments: [] });
		}

		const files = content.Attachments.map((att) => ({
			filename: att.Title,
			base64: Buffer.from(att.Data).toString('base64'),
			contentType: att.ContentType || 'application/octet-stream',
		}));

		const htmlBody = content.Body
			? Buffer.from(content.Body).toString('utf8')
			: '<p>No HTML found</p>';

		res.json({
			html: htmlBody,
			attachments: files,
		});
	});
});

app.get('/', (req, res) => {
	res.send('✅ Winmail Extractor API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
