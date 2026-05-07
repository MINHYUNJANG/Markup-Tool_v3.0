import { corsResponse, optionsResponse } from '../../lib/cors.js';
import { crawl } from '../../lib/crawler.js';

export const dynamic = 'force-dynamic';

export function OPTIONS() { return optionsResponse(); }

export async function POST(request) {
  try {
    const { url, selector = '' } = await request.json();
    const result = await crawl(url, selector);
    if (!result.success) return corsResponse({ detail: result.error }, { status: 400 });
    return corsResponse(result);
  } catch (e) {
    return corsResponse({ detail: e.message }, { status: 500 });
  }
}
