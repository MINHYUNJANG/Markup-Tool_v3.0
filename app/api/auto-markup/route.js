import { crawl } from '../../../lib/crawler.js';
import { autoMarkup } from '../../../lib/ai-mapper.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { url, selector = '' } = await request.json();
    const crawled = await crawl(url, selector);
    if (!crawled.success) return Response.json({ detail: crawled.error }, { status: 400 });
    const html = await autoMarkup(crawled);
    return Response.json({ html, crawled });
  } catch (e) {
    return Response.json({ detail: e.message }, { status: 500 });
  }
}
