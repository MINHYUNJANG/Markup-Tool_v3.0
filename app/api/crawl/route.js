import { crawl } from '../../../lib/crawler.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { url, selector = '' } = await request.json();
    const result = await crawl(url, selector);
    if (!result.success) return Response.json({ detail: result.error }, { status: 400 });
    return Response.json(result);
  } catch (e) {
    return Response.json({ detail: e.message }, { status: 500 });
  }
}
