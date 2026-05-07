import { corsResponse, optionsResponse } from '../../lib/cors.js';
import { crawl } from '../../lib/crawler.js';
import { autoMarkup } from '../../lib/ai-mapper.js';

export const dynamic = 'force-dynamic';

export function OPTIONS() { return optionsResponse(); }

export async function POST(request) {
  try {
    const { url, selector = '' } = await request.json();
    const crawled = await crawl(url, selector);
    if (!crawled.success) return corsResponse({ detail: crawled.error }, { status: 400 });
    const html = await autoMarkup(crawled);
    return corsResponse({ html, crawled });
  } catch (e) {
    return corsResponse({ detail: e.message }, { status: 500 });
  }
}
