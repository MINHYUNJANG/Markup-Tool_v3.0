import { corsResponse, optionsResponse } from '../lib/cors.js';

export const dynamic = 'force-dynamic';

export function OPTIONS() { return optionsResponse(); }
export function GET() { return corsResponse({ status: 'ok' }); }
