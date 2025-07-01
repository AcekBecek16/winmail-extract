import { parseBuffer } from 'node-tnef';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).send('Method Not Allowed');
	}

	try {
		const { base64, filename } = req.body;
		const buffer = Buffer.from(base64, 'base64');

		parseBuffer(buffer, (err, content) => {
			if (err) {
				console.error('TNEF parse error:', err);
				return res.status(500).json({ error: 'Parsing error' });
			}

			const html = content.Body
				? Buffer.from(content.Body).toString('utf8')
				: '<p>No HTML content found.</p>';

			const attachments = (content.Attachments || []).map((att) => ({
				filename: att.Title || `file-${Date.now()}`,
				base64: Buffer.from(att.Data).toString('base64'),
				contentType: att.ContentType || 'application/octet-stream',
			}));

			return res.status(200).json({ html, attachments });
		});
	} catch (err) {
		console.error('Unhandled error:', err);
		res.status(500).json({ error: 'Server error' });
	}
}
