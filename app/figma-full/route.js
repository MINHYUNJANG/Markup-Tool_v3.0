import { corsResponse, optionsResponse } from '../../lib/cors.js';
import { figmaFullMarkup } from '../../lib/figma.js';

export const dynamic = 'force-dynamic';

export function OPTIONS() { return optionsResponse(); }

export async function POST(request) {
  try {
    const { url } = await request.json();
    const result = await figmaFullMarkup(url);
    return corsResponse(result);
  } catch (e) {
    const status = e.message.includes('올바른 Figma URL') ? 400 : 500;
    return corsResponse({ detail: e.message }, { status });
  }
}
