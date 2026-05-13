import { figmaAccurateMarkup } from '../../../lib/figma.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request) {
  try {
    const { url, markup_type = 'html' } = await request.json();
    const result = await figmaAccurateMarkup(url, markup_type);
    return Response.json(result);
  } catch (e) {
    const status = e.message.includes('올바른 Figma URL') ? 400 : 500;
    return Response.json({ detail: e.message }, { status });
  }
}
