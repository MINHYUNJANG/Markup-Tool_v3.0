import { crawl } from '../../../lib/crawler.js';
import { mapToTemplate } from '../../../lib/ai-mapper.js';
import { figmaMarkup } from '../../../lib/figma.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  try {
    const { url, selector = '', template_html } = await request.json();

    if (url.includes('figma.com')) {
      const result = await figmaMarkup(url, 'none', '');
      return Response.json({ html: result.html });
    }

    const crawled = await crawl(url, selector);
    if (!crawled.success) return Response.json({ detail: crawled.error }, { status: 400 });
    const html = await mapToTemplate(template_html, crawled);
    return Response.json({ html });
  } catch (e) {
    return Response.json({ detail: e.message }, { status: 500 });
  }
}
