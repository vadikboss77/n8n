import axios from 'axios';
import { htmlToText } from 'html-to-text';

export async function fetchWebpageText(url: string): Promise<string> {
	const response = await axios.get(url, {
		timeout: 15000,
		headers: {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
		},
	});
	const text = htmlToText(response.data ?? '', {
		selectors: [
			{ selector: 'script', format: 'skip' },
			{ selector: 'style', format: 'skip' },
			{ selector: 'noscript', format: 'skip' },
		],
		wordwrap: 120,
	});
	return text;
}

export async function fetchMany(urls: string[], maxChars = 20000): Promise<string> {
	const chunks: string[] = [];
	for (const url of urls) {
		try {
			const txt = await fetchWebpageText(url);
			chunks.push(`URL: ${url}\n${txt}`);
			if (chunks.join('\n\n').length > maxChars) break;
		} catch (e) {
			chunks.push(`URL: ${url}\n[Ошибка загрузки: ${(e as Error).message}]`);
		}
	}
	let combined = chunks.join('\n\n');
	if (combined.length > maxChars) combined = combined.slice(0, maxChars);
	return combined;
}
