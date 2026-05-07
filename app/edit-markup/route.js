import { corsResponse, optionsResponse } from '../../lib/cors.js';
import { editMarkup } from '../../lib/ai-mapper.js';

export const dynamic = 'force-dynamic';

export function OPTIONS() { return optionsResponse(); }

export async function POST(request) {
  try {
    const { html, instruction } = await request.json();
    const result = await editMarkup(html, instruction);
    return corsResponse({ html: result });
  } catch (e) {
    return corsResponse({ detail: e.message }, { status: 500 });
  }
}
