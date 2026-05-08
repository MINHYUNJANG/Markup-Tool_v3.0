import { crawl } from '../../../lib/crawler.js';
import { mapToTemplate } from '../../../lib/ai-mapper.js';
import { figmaMarkupFast } from '../../../lib/figma.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TIMEOUT_MS = 9000;

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('처리 시간이 초과되었습니다. 잠시 후 다시 시도하거나 node-id가 포함된 Figma URL을 사용해주세요.')), TIMEOUT_MS)
    ),
  ]);
}

export async function POST(request) {
  try {
    const { url, selector = '', template_html } = await request.json();

    if (url.includes('figma.com')) {
      const result = await withTimeout(figmaMarkupFast(url, template_html));
      return Response.json({ html: result.html });
    }

    const crawled = await withTimeout(crawl(url, selector));
    if (!crawled.success) return Response.json({ detail: crawled.error }, { status: 400 });
    const html = await withTimeout(mapToTemplate(template_html, crawled));
    return Response.json({ html });
  } catch (e) {
    return Response.json({ detail: e.message }, { status: 500 });
  }
}
