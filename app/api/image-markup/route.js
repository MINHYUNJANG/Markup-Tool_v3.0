// 이미지 투 마크업 v2
// Phase 1: 이미지 → 레이아웃 구조화 JSON  [Vision AI]
// Phase 2: JSON → 규칙 기반 HTML + CSS    [Text AI]

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_VISION_MODELS = [
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];
const GROQ_TEXT_MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama-3.1-8b-instant',
];

/* ── Gemini 호출 (vision + text 공용) ── */
async function callGemini(apiKey, systemText, parts, maxTokens = 8192) {
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
          body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0, messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content },
          ]}),
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

/* ── Groq Text 호출 ── */
async function callGroqText(apiKey, systemPrompt, userText, maxTokens = 8192) {
  let lastErr;
  for (const model of GROQ_TEXT_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0, messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
        ]}),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || `Groq ${res.status}`;
        lastErr = new Error(msg);
        if ([429, 413].includes(res.status)) break;
        throw lastErr;
      }
      return data.choices?.[0]?.message?.content ?? '';
    } catch (e) { lastErr = e; }
  }
  throw lastErr ?? new Error('Groq text 모든 모델 실패');
}

/* ── Phase 1: 이미지 → JSON ── */
async function visionToJson(geminiKey, groqKey, imagePart) {
  const prompt = '이 웹 디자인 시안을 분석하여 레이아웃 JSON을 출력하라. 텍스트를 한 글자도 빠짐없이 그대로 복사하고 구조·색상·수치를 정확히 추출하라. JSON만 출력. 설명 금지.';
  if (geminiKey) {
    try {
      return await callGemini(geminiKey, LAYOUT_SYSTEM, [imagePart, { text: prompt }], 4096);
    } catch (e) {
      if (!e.isQuota) throw e;
      console.warn('[image-markup] Gemini 할당량 초과 → Groq vision 폴백');
    }
  }
  if (!groqKey) throw new Error('GEMINI_API_KEY 또는 GROQ_API_KEY가 필요합니다.');
  return callGroqVision(groqKey, LAYOUT_SYSTEM, imagePart, prompt, 4096);
}

/* ── Phase 2: JSON → HTML + CSS ── */
async function jsonToMarkup(geminiKey, groqKey, jsonStr) {
  const prompt = `아래 웹 시안 레이아웃 JSON을 HTML + CSS로 변환하라.
JSON의 text/items 값은 한 글자도 바꾸지 말 것.
모든 요소에 style="" 속성 절대 금지.
===HTML=== 다음 HTML, ===CSS=== 다음 CSS를 출력하라.

[레이아웃 JSON]
${jsonStr}`;
  if (geminiKey) {
    try {
      return await callGemini(geminiKey, MARKUP_SYSTEM, [{ text: prompt }], 8192);
    } catch (e) {
      if (!e.isQuota) throw e;
      console.warn('[image-markup] Gemini 할당량 초과 → Groq text 폴백');
    }
  }
  if (!groqKey) throw new Error('GEMINI_API_KEY 또는 GROQ_API_KEY가 필요합니다.');
  return callGroqText(groqKey, MARKUP_SYSTEM, prompt, 8192);
}

/* ─────────────────────────────────────────
   Phase 1 시스템 프롬프트
   이미지 → 레이아웃 구조화 JSON
───────────────────────────────────────── */
const LAYOUT_SYSTEM = `You are a precise web layout analyzer.
Scan the design image and output a JSON object that fully describes every content section.

SKIP: global navigation bar (GNB), top header bar, LNB, footer, breadcrumbs.
START from the first main content area, scan downward to the last content section.

ACCURACY RULES:
- Copy every text CHARACTER BY CHARACTER. Never invent, translate, or paraphrase.
- Mark unreadable text as "[?]"
- Count repeated elements (cards, list items, tabs, dots) by literally counting pixels
- Sample hex color codes from actual pixels
- Detect sliders: any section with ◀▶ arrow buttons OR dot-pagination → isSlider:true

OUTPUT — JSON object only (no markdown, no explanation):
{
  "sections": [
    {
      "idx": 1,
      "type": "main-visual | card-grid | notice-board | quick-menu | tab-board | banner | gallery | accordion | calendar | form | text-content",
      "name": "short descriptive english name",
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
          "tag": "suggested html tag",
          "text": "EXACT TEXT copied character by character",
          "items": ["exact item 1", "exact item 2"],
          "count": 1,
          "w": "Npx",
          "h": "Npx",
          "fontSize": "Npx",
          "fontWeight": "400 | 700",
          "color": "#hex",
          "bg": "#hex",
          "borderRadius": "Npx",
          "border": "Npx solid #hex",
          "shadow": "css box-shadow value or none",
          "padding": "Npx Npx Npx Npx",
          "gap": "Npx"
        }
      ]
    }
  ]
}`;

/* ─────────────────────────────────────────
   Phase 2 시스템 프롬프트
   JSON → 규칙 기반 HTML + CSS
───────────────────────────────────────── */
const MARKUP_SYSTEM = `당신은 10년차 웹 퍼블리셔입니다. 웹 시안의 레이아웃 JSON을 입력받아 실무 수준의 HTML + CSS를 생성합니다.

━━━ 콘텐츠 규칙 ━━━
• JSON의 text/items 값은 한 글자도 바꾸지 말 것
• JSON에 없는 텍스트·요소 추가 금지
• count/items 개수만큼만 요소 생성
• header / GNB / footer 출력 금지

━━━ HTML 속성 규칙 ━━━
• style="" 속성 절대 금지 — 모든 스타일은 CSS 클래스 선택자로만
• 허용 속성: class, id, role, aria-*, href, src, alt, type, data-*

━━━ 섹션 네이밍 ━━━
• JSON idx 순서대로 → .MC_box1, .MC_box2, .MC_box3 …
• 첫 섹션이 main-visual → class="MC_box1 main-visual"

━━━ 컴포넌트 규칙 ━━━

슬라이더 (isSlider:true):
<div class="swiper">
  <div class="swiper-wrapper">
    <div class="swiper-slide">…</div>
  </div>
  <button type="button" class="btn-prev"><span class="hid">이전</span></button>
  <button type="button" class="btn-next"><span class="hid">다음</span></button>
  <div class="swiper-pagination"></div>
</div>
(hasDots:false면 swiper-pagination 생략 / slideCount 개수만큼 swiper-slide 생성)

탭:
<ul class="tab-list" role="tablist">
  <li role="presentation"><a href="#tab1" class="current" role="tab" id="tab1" aria-selected="true" aria-controls="panel1">탭명</a></li>
</ul>
<div id="panel1" class="box on" role="tabpanel" aria-labelledby="tab1"></div>
<div id="panel2" class="box" role="tabpanel" aria-labelledby="tab2" hidden></div>

게시판 목록:
<ul class="list" role="list">
  <li><a href="#">텍스트</a></li>
</ul>

바로가기:
<ul class="quick-list">
  <li><a href="#">텍스트</a></li>
</ul>

카드 그리드 (layout.type=grid):
<ul class="card-list">
  <li>…</li>
</ul>

━━━ CSS 규칙 ━━━
• CSS reset·font-family 작성 금지 (외부 파일에 포함됨)
• html 기준 font-size: 20px (1rem = 20px)
• font-size·padding·margin·gap·line-height는 rem으로 변환 (예: 16px → 0.8rem / 40px → 2rem)
• border-width·box-shadow·border-radius는 px 유지
• 섹션 컨테이너(.MC_box*) width가 960px 이상이면 width: 100%
• JSON의 bg·color·fontSize·fontWeight·padding·gap·borderRadius·shadow를 모두 CSS 클래스에 반영

━━━ 접근성 ━━━
• img alt 반드시 작성
• 버튼에 <span class="hid">숨김텍스트</span> 포함
• role/aria-* 적절히 사용

━━━ 출력 형식 (필수 준수) ━━━
===HTML===
(HTML 코드만. style="" 속성 없음.)
===CSS===
(CSS 코드만. rem 변환 적용.)
설명·주석·코드블럭 절대 금지.`;

/* ── 파서 유틸 ── */
function stripJsonFence(raw) {
  return raw.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1');
}

function parseHtmlCss(raw) {
  const text = raw.trim().replace(/^```(?:html)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1');
  const htmlMatch = text.match(/===HTML===\s*([\s\S]*?)\s*===CSS===/);
  const cssMatch  = text.match(/===CSS===\s*([\s\S]*)$/);
  const html = htmlMatch ? htmlMatch[1].trim() : text;
  const css  = cssMatch  ? cssMatch[1].trim()  : '';
  return { html: stripInlineStyles(html), css: transformCss(css) };
}

function stripInlineStyles(html) {
  return html.replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
}

function transformCss(css) {
  const BASE = 20;
  css = css.replace(/\bwidth\s*:\s*(\d+)px/g, (_, n) =>
    parseInt(n, 10) >= 960 ? 'width: 100%' : `width: ${n}px`
  );
  const remProps = [
    'font-size', 'line-height', 'letter-spacing',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin',  'margin-top',  'margin-right',  'margin-bottom',  'margin-left',
    'gap', 'row-gap', 'column-gap',
    'top', 'right', 'bottom', 'left',
  ];
  const propPattern = remProps.map(p => p.replace(/-/g, '\\-')).join('|');
  const propRegex = new RegExp(`\\b(${propPattern})\\s*:\\s*([^;{}\\n]+)`, 'gi');
  css = css.replace(propRegex, (match, prop, value) => {
    const converted = value.replace(/(\d+(?:\.\d+)?)px/g, (_, n) => {
      const num = parseFloat(n);
      if (num === 0) return '0';
      if (num <= 1) return `${n}px`;
      const rem = +(num / BASE).toFixed(4).replace(/\.?0+$/, '');
      return `${rem}rem`;
    });
    return `${prop}: ${converted}`;
  });
  return css;
}

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

    const bytes    = Buffer.from(await imageFile.arrayBuffer());
    const b64      = bytes.toString('base64');
    const mimeType = imageFile.type || 'image/png';
    const imagePart = { inlineData: { mimeType, data: b64 } };

    /* ── Phase 1: 이미지 → 레이아웃 JSON ── */
    const rawJson = await visionToJson(geminiKey, groqKey, imagePart);
    const layoutJsonStr = stripJsonFence(rawJson);
    let layoutJson = null;
    try { layoutJson = JSON.parse(layoutJsonStr); } catch {}

    /* ── Phase 2: JSON → HTML + CSS ── */
    const markupText = await jsonToMarkup(geminiKey, groqKey, layoutJsonStr);
    const { html, css } = parseHtmlCss(markupText);

    return Response.json({ html, css, layoutJson });
  } catch (e) {
    console.error('[image-markup] error:', e);
    return Response.json({ detail: e.message || '마크업 생성에 실패했습니다.' }, { status: 500 });
  }
}
