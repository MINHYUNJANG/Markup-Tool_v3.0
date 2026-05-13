// 이미지 투 마크업 v2
// Phase 1: 이미지 → 레이아웃 구조화 JSON  [Vision AI]
// Phase 2: JSON → 규칙 기반 HTML + CSS    [코드]

import { generateHtmlCss } from '../../../lib/image-markup-renderer.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_VISION_MODELS = [
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];

/* ── Gemini Vision 호출 ── */
async function callGemini(apiKey, systemText, parts, maxTokens = 4096) {
  const res = await fetch(`${GEMINI_API}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemText }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0, topP: 0.95 },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `Gemini ${res.status}`;
    const err = new Error(msg);
    err.isQuota = res.status === 429 || msg.toLowerCase().includes('quota');
    throw err;
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/* ── Groq Vision 호출 ── */
async function callGroqVision(apiKey, systemPrompt, imagePart, textPrompt, maxTokens = 4096) {
  function parseRetryDelay(msg = '') {
    const m = msg.match(/try again in\s+([\d.]+)s/i);
    return m ? Math.ceil(parseFloat(m[1]) * 1000) + 500 : null;
  }
  const content = [
    { type: 'image_url', image_url: { url: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` } },
    { type: 'text', text: textPrompt },
  ];
  let lastErr;
  for (const model of GROQ_VISION_MODELS) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model, max_tokens: maxTokens, temperature: 0,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content },
            ],
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.error?.message || `Groq ${res.status}`;
          lastErr = new Error(msg);
          if (res.status === 429 && msg.includes('per minute')) {
            await new Promise(r => setTimeout(r, parseRetryDelay(msg) ?? 8000));
            continue;
          }
          break;
        }
        return data.choices?.[0]?.message?.content ?? '';
      } catch (e) { lastErr = e; break; }
    }
  }
  throw lastErr ?? new Error('Groq vision 모든 모델 실패');
}

/* ── 이미지 → JSON ── */
async function visionToJson(geminiKey, groqKey, imagePart) {
  const prompt = '이 웹 디자인 시안을 분석하여 레이아웃 JSON을 출력하라. 텍스트를 한 글자도 빠짐없이 그대로 복사하고 구조·색상·수치를 정확히 추출하라. JSON만 출력. 설명 금지.';
  if (geminiKey) {
    try {
      return await callGemini(geminiKey, LAYOUT_SYSTEM, [imagePart, { text: prompt }], 8192);
    } catch (e) {
      if (!e.isQuota) throw e;
      console.warn('[image-markup] Gemini 할당량 초과 → Groq vision 폴백');
    }
  }
  if (!groqKey) throw new Error('GEMINI_API_KEY 또는 GROQ_API_KEY가 필요합니다.');
  return callGroqVision(groqKey, LAYOUT_SYSTEM, imagePart, prompt, 8192);
}

function extractJson(raw) {
  // 코드펜스 제거 (닫힌 경우 + 잘린 경우 모두)
  let text = raw.trim()
    .replace(/^```(?:json)?\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();

  // 1) 그대로 파싱
  try { return JSON.parse(text); } catch {}

  // 2) { ... } 블록 추출 (앞뒤 설명 텍스트 제거)
  const objStart = text.indexOf('{');
  const objEnd   = text.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(text.slice(objStart, objEnd + 1)); } catch {}
  }

  // 3) [ ... ] → sections 래핑
  const arrStart = text.indexOf('[');
  const arrEnd   = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    try {
      const arr = JSON.parse(text.slice(arrStart, arrEnd + 1));
      if (Array.isArray(arr)) return { sections: arr };
    } catch {}
  }

  // 4) 잘린 JSON 복구: 열린 괄호를 역순으로 닫기
  const base = objStart !== -1 ? text.slice(objStart) : text;
  try { return JSON.parse(repairJson(base)); } catch {}

  throw new Error(`JSON 파싱 실패 (응답 앞부분: ${text.slice(0, 120)})`);
}

function repairJson(s) {
  const stack = [];
  let inStr = false, esc = false;
  let lastBalanced = 0;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') {
      if (stack.length) { stack.pop(); if (!stack.length) lastBalanced = i + 1; }
    }
  }

  const tail = stack.reverse().map(c => c === '{' ? '}' : ']').join('');
  return s.slice(0, lastBalanced || s.length) + tail;
}

/* ─────────────────────────────────────────
   Phase 1 시스템 프롬프트
   이미지 → 레이아웃 구조화 JSON
───────────────────────────────────────── */
const LAYOUT_SYSTEM = `You are a precise web layout analyzer for Korean 공공기관/교육기관 (public/educational institution) websites.
Scan the ENTIRE design image from top to bottom and output a JSON object describing EVERY region.

INCLUDE ALL regions:
- header: logo, site name, top navigation (GNB), search bar, utility links
- main content sections: main-visual, quick-menu, card-grid, notice-board, tab-board, banner, gallery, etc.
- footer: address, links, copyright, family-site selector, etc.

ANALYSIS RULES:
1. Do NOT output flat structures — identify every semantic region precisely.
2. Use semantic section types: header, footer, main-visual, quick-menu, card-grid, notice-board, tab-board, banner, gallery.
3. Title elements: role "heading" with tag "h2" or "h3".
4. Repeated content items → use "items" array (will be rendered as ul/li).
5. Slider regions (◀▶ arrows or dot pagination) → isSlider: true, slideCount: N.
6. Images → role: "image", text = meaningful alt description.
7. Copy every text CHARACTER BY CHARACTER. Never invent, translate, or paraphrase.
8. Count repeated elements by literally counting them in the image.
9. Sample hex colors from actual pixels.
10. Mark unreadable text as "[?]".
11. DO NOT skip any region — scan everything visible top to bottom.
12. Output JSON only — no markdown fences, no explanation.

OUTPUT — JSON object only:
{
  "sections": [
    {
      "idx": 1,
      "type": "header | footer | main-visual | card-grid | notice-board | quick-menu | tab-board | banner | gallery | accordion | calendar | form | text-content",
      "name": "short english label",
      "isSlider": false,
      "slideCount": 0,
      "hasDots": false,
      "hasPrevNext": false,
      "bg": "#hex",
      "height": "Npx",
      "padding": "Npx Npx Npx Npx",
      "layout": {
        "type": "flex | grid | block",
        "direction": "row | column",
        "cols": 0,
        "gap": "Npx",
        "alignItems": "center | flex-start | flex-end | stretch",
        "justifyContent": "center | space-between | flex-start | flex-end"
      },
      "elements": [
        {
          "role": "heading | subheading | label | text | button | link | image | icon | tab-list | list | input | date | count | badge | pagination",
          "tag": "h2 | h3 | p | a | button | img | span | ...",
          "text": "EXACT TEXT copied character by character",
          "items": ["exact item 1", "exact item 2"],
          "count": 1,
          "w": "Npx", "h": "Npx",
          "fontSize": "Npx", "fontWeight": "400 | 700",
          "color": "#hex", "bg": "#hex",
          "borderRadius": "Npx", "border": "Npx solid #hex",
          "shadow": "css box-shadow value or none",
          "padding": "Npx Npx Npx Npx",
          "gap": "Npx"
        }
      ],

      "cards": [
        {
          "elements": [
            {"role": "image", "h": "Npx", "text": "alt text"},
            {"role": "heading", "text": "카드 제목"},
            {"role": "text", "text": "카드 설명"},
            {"role": "link", "text": "더보기"}
          ]
        }
      ]
    }
  ]
}

IMPORTANT: "cards" array is ONLY for "card-grid" and "gallery" section types.
Each card gets its own "elements" array describing its internal components.
For all other section types, use only "elements".`;

/* ── POST 핸들러 ── */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image');
    if (!imageFile) {
      return Response.json({ detail: '이미지가 없습니다.' }, { status: 400 });
    }
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const groqKey   = process.env.GROQ_API_KEY   || '';
    if (!geminiKey && !groqKey) {
      return Response.json({ detail: 'GEMINI_API_KEY 또는 GROQ_API_KEY가 필요합니다.' }, { status: 500 });
    }

    const bytes     = Buffer.from(await imageFile.arrayBuffer());
    const b64       = bytes.toString('base64');
    const mimeType  = imageFile.type || 'image/png';
    const imagePart = { inlineData: { mimeType, data: b64 } };

    /* Phase 1: 이미지 → 레이아웃 JSON */
    const rawJson = await visionToJson(geminiKey, groqKey, imagePart);

    let layoutJson;
    try {
      layoutJson = extractJson(rawJson);
    } catch (e) {
      console.error('[image-markup] JSON 파싱 실패:', e.message);
      return Response.json({ detail: `레이아웃 분석 결과를 파싱할 수 없습니다. (${e.message})` }, { status: 500 });
    }

    // sections 배열 보장
    if (!layoutJson.sections) layoutJson = { sections: [] };

    /* Phase 2: JSON → 규칙 기반 HTML + CSS (코드) */
    const { html, css } = generateHtmlCss(layoutJson);

    return Response.json({ html, css, layoutJson });
  } catch (e) {
    console.error('[image-markup] error:', e);
    return Response.json({ detail: e.message || '마크업 생성에 실패했습니다.' }, { status: 500 });
  }
}
