import { parseBuffer } from 'node-tnef';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	try {
		// ⛏️ Manually collect and parse the body
		let body = '';
		for await (const chunk of req) {
			body += chunk;
		}

		const { base64, filename } = JSON.parse(body);

		if (!base64 || !filename) {
			return res.status(400).json({ error: 'Missing base64 or filename' });
		}

		const buffer = Buffer.from(base64, 'base64');

		parseBuffer(buffer, (err, content) => {
			if (err) {
				console.error('TNEF parse error:', err);
				return res.status(500).json({ error: 'Failed to parse winmail.dat' });
			}

			const html = content.Body
				? Buffer.from(content.Body).toString('utf8')
				: '<p>No HTML body found.</p>';

			const attachments = (content.Attachments || []).map((att) => ({
				filename: att.Title || 'file.dat',
				base64: Buffer.from(att.Data).toString('base64'),
				contentType: att.ContentType || 'application/octet-stream',
			}));

			return res.status(200).json({ html, attachments });
		});
	} catch (error) {
		console.error('Unhandled Error:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
}
