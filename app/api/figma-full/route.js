import { figmaFullMarkup } from '../../../lib/figma.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { url } = await request.json();
    const result = await figmaFullMarkup(url);
    return Response.json(result);
  } catch (e) {
    const status = e.message.includes('올바른 Figma URL') ? 400 : 500;
    return Response.json({ detail: e.message }, { status });
  }
}
