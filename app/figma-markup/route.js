import { corsResponse, optionsResponse } from '../../lib/cors.js';
import { figmaMarkup } from '../../lib/figma.js';

export const dynamic = 'force-dynamic';

export function OPTIONS() { return optionsResponse(); }

export async function POST(request) {
  try {
    const { url, component_type = 'auto', variant = 'auto' } = await request.json();
    const result = await figmaMarkup(url, component_type, variant);
    return corsResponse(result);
  } catch (e) {
    const status = e.message.includes('올바른 Figma URL') ? 400 : 500;
    return corsResponse({ detail: e.message }, { status });
  }
}
