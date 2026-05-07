import { editMarkup } from '../../../lib/ai-mapper.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { html, instruction } = await request.json();
    const result = await editMarkup(html, instruction);
    return Response.json({ html: result });
  } catch (e) {
    return Response.json({ detail: e.message }, { status: 500 });
  }
}
