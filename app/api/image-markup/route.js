// 이미지 투 마크업
// 1순위: Gemini 2.0 Flash / 2순위(폴백): Groq llama-4-maverick
// temperature:0 으로 창작 최소화, 시안 원형 최대한 재현

const GEMINI_API    = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL  = 'gemini-2.0-flash';
const GROQ_MODELS   = [
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];

/* ── Gemini 호출 ── */
async function callGemini(apiKey, systemText, userParts, maxTokens = 8192) {
  const res = await fetch(`${GEMINI_API}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemText }] },
      contents: [{ role: 'user', parts: userParts }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0, topP: 0.95 },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `Gemini ${res.status}`;
    // 할당량 초과이면 폴백 가능하도록 별도 에러 표시
    const isQuota = res.status === 429 || msg.includes('Quota') || msg.includes('quota');
    const err = new Error(msg);
    err.isQuota = isQuota;
    throw err;
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/* ── Groq 폴백 호출 (TPM 초과 시 자동 재시도) ── */
async function callGroq(apiKey, systemPrompt, userParts, maxTokens = 8192) {
  const imagePart = userParts.find(p => p.inlineData);
  const textPart  = userParts.find(p => p.text);
  const content = [
    ...(imagePart ? [{ type: 'image_url', image_url: { url: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` } }] : []),
    { type: 'text', text: textPart?.text ?? '' },
  ];

  // 에러 메시지에서 재시도 대기 시간 추출 (e.g. "try again in 5.34s")
  function parseRetryDelay(msg = '') {
    const m = msg.match(/try again in\s+([\d.]+)s/i);
    return m ? Math.ceil(parseFloat(m[1]) * 1000) + 500 : null;
  }

  let lastErr;
  for (const model of GROQ_MODELS) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model, max_tokens: maxTokens, temperature: 0,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content },
            ],
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.error?.message || `Groq ${res.status}`;
          lastErr = new Error(msg);
          // TPM(분당) 초과 → 대기 후 재시도
          if (res.status === 429 && msg.includes('per minute')) {
            const delay = parseRetryDelay(msg) ?? 8000;
            console.warn(`[image-markup] Groq TPM 초과, ${delay}ms 후 재시도...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          // TPD(일일) 초과 → 다음 모델로
          break;
        }
        return data.choices?.[0]?.message?.content ?? '';
      } catch (e) { lastErr = e; break; }
    }
  }
  throw lastErr ?? new Error('Groq 모든 모델 실패');
}

/* ── 통합 호출 (Gemini 우선, 할당량 초과 시 Groq 폴백) ── */
async function vision(geminiKey, groqKey, systemText, userParts, maxTokens) {
  if (geminiKey) {
    try {
      return await callGemini(geminiKey, systemText, userParts, maxTokens);
    } catch (e) {
      if (!e.isQuota) throw e; // 할당량 외 에러는 그대로 throw
      console.warn('[image-markup] Gemini 할당량 초과 → Groq 폴백');
    }
  }
  if (!groqKey) throw new Error('GEMINI_API_KEY 또는 GROQ_API_KEY가 필요합니다.');
  return callGroq(groqKey, systemText, userParts, maxTokens);
}

/* ─────────────────────────────────────────
   Step 1 – 콘텐츠 스캐너
   시안을 글자·픽셀 단위로 읽어 JSON으로 복사.
   창작·요약·해석 절대 금지.
───────────────────────────────────────── */
const SCAN_SYSTEM = `You are a pixel-perfect content scanner for web design images.
Your ONLY job: READ and COPY exactly what you see. Never invent, paraphrase, translate, or summarize.

SKIP ENTIRELY: top header bar, global navigation (GNB), left/right navigation (LNB), footer, breadcrumb.
Start from the FIRST main content section and scan downward.

OUTPUT RULES:
- Copy every text string CHARACTER BY CHARACTER as it appears in the image.
- If text is unreadable, write the readable part + "[?]" for unclear characters.
- Count every repeated element (cards, list items, tabs, dots) by literally counting pixels.
- Extract hex color codes by sampling the actual pixels.
- Estimate pixel dimensions as accurately as possible.
- Detect sliders: any section with arrow buttons (◀▶ <> ← → prev/next icons) OR dot-pagination → isSlider:true.

Output a JSON array. Each object = one content section:
[
  {
    "idx": 1,
    "name": "main-visual | quick-menu | notice | card-grid | banner | tab-board | ...",
    "isSlider": false,
    "slideCount": 0,
    "hasDots": false,
    "hasPrevNext": false,
    "bg": "#hex",
    "width": "Npx",
    "height": "Npx",
    "padding": "top right bottom left",
    "layout": {
      "type": "flex|grid|absolute",
      "direction": "row|column",
      "cols": 0,
      "gap": "Npx",
      "alignItems": "center|flex-start|...",
      "justifyContent": "center|space-between|..."
    },
    "elements": [
      {
        "role": "image|heading|text|button|link|list|tab|icon|badge|input",
        "tag": "img|h2|h3|p|a|button|ul|span|div",
        "exactText": "EXACT TEXT COPIED CHARACTER BY CHARACTER",
        "listItems": ["exact item 1 text", "exact item 2 text"],
        "count": 1,
        "w": "Npx",
        "h": "Npx",
        "fontSize": "Npx",
        "fontWeight": "400|700",
        "color": "#hex",
        "bg": "#hex",
        "borderRadius": "Npx",
        "border": "Npx solid #hex",
        "shadow": "css value or none",
        "padding": "top right bottom left",
        "gap": "Npx"
      }
    ]
  }
]

Output ONLY valid JSON array. No markdown. No explanation.`;

/* ─────────────────────────────────────────
   Step 2 – 더블체크 & 보정
   Step 1 JSON을 시안 원본과 대조하여 오류 수정.
───────────────────────────────────────── */
const VERIFY_SYSTEM = `You are a meticulous QA inspector for web design extraction.
You will receive: (1) the original design image, (2) a JSON that claims to describe the design.

Your job: compare the JSON against the actual image pixel by pixel and fix every discrepancy.

CHECK EACH SECTION AND ELEMENT FOR:
1. MISSING sections — sections visible in the image but absent from the JSON → add them
2. EXTRA sections — sections in JSON that do NOT exist in the image → remove them
3. Wrong text — any exactText or listItems value that differs from what is actually written in the image → correct it character by character
4. Wrong counts — count or listItems length that doesn't match the actual number visible → correct it
5. Wrong colors — bg, color values that don't match the actual image → correct them
6. Wrong dimensions — w, h, fontSize values that are clearly off → correct them
7. Wrong isSlider — sections with visible arrow buttons or dots that are marked false → set true
8. Wrong layout type — layout.type or layout.cols that doesn't match the visual structure → correct them

RULES:
- Do NOT invent new content. Only fix what is wrong by comparing to the image.
- If a value in the JSON is correct, keep it unchanged.
- If a section in the JSON was never in the image (hallucinated), remove it.
- header, GNB, LNB, footer must NOT appear — remove them if present in JSON.

Output the corrected JSON array ONLY. No explanation. No markdown.`;

/* ─────────────────────────────────────────
   Step 3 – 마크업 생성
   검증된 JSON이 유일한 콘텐츠 소스.
   단 한 글자도 추가·변경·창작 금지.
───────────────────────────────────────── */
const MARKUP_SYSTEM = `당신은 10년차 웹 퍼블리셔입니다. 실무 운영 프로젝트 수준으로 퍼블리싱하세요.

━━━ style 속성(attribute) 사용 절대 금지 ━━━
div, p, span, a, button, ul, li, img, h2, h3 등 모든 요소(element)에
style="..." 속성(attribute)을 절대 작성하지 마라.

금지 예시 (절대 작성 금지):
  <div style="color:red">          ← 금지
  <p style="font-size:16px">       ← 금지
  <span style="background:#fff">   ← 금지

허용 예시 (이렇게만 작성):
  <div class="notice-title">       ← 허용
  <p class="desc-txt">             ← 허용

색상·크기·여백·폰트·border·shadow 등 모든 스타일은
===CSS=== 영역의 .클래스명 { } 선택자 안에만 작성하라.
허용 속성: class, id, role, aria-*, href, src, alt, type, data-* 만 허용.

━━━ 콘텐츠 창작 절대 금지 ━━━
스캔 JSON이 이 시안의 유일한 콘텐츠 소스다.
JSON의 exactText, listItems 값을 한 글자도 바꾸지 말고 그대로 복사하라.
JSON에 없는 텍스트·링크·요소를 추가하는 것은 엄중히 금지된다.
listItems 배열이 있으면 그 개수만큼만 li를 생성하라.
count 값이 있으면 그 개수만큼만 요소를 생성하라.

━━━ 출력 범위 ━━━
본문 콘텐츠만 출력. header / GNB / LNB / footer 절대 출력 금지.

━━━ 섹션 규칙 ━━━
• JSON idx 순서 그대로 → MC_box1, MC_box2, MC_box3 …
• 첫 섹션이 메인비주얼(대형 배너·이미지·풀스크린) → class="MC_box1 main-visual"
• JSON bg, width, height, padding 값을 CSS에 정확히 반영

━━━ 슬라이더 규칙 ━━━
JSON isSlider:true → 반드시 swiper 구조:
<div class="swiper">
  <div class="swiper-wrapper">
    <div class="swiper-slide">…</div>  (slideCount 개수만큼)
  </div>
  <button type="button" class="btn-prev"><span class="hid">이전 슬라이드</span></button>
  <button type="button" class="btn-next"><span class="hid">다음 슬라이드</span></button>
  <div class="swiper-pagination"></div>  (hasDots:false 면 생략)
</div>

━━━ 레이아웃 규칙 ━━━
• flex: 1차원 정렬 / grid: 카드 2차원 (layout.cols 기준) / absolute: 겹침만
• JSON gap, padding 수치 그대로 사용
• line-height 자동 보정 금지 / transform 위치 보정 금지

━━━ 이미지 처리 ━━━
img 또는 span.img. JSON w·h 수치 그대로. background-image 금지.

━━━ 컴포넌트 규칙 ━━━
게시판:
<ul class="list" role="list">
  <li><a href="#">exactText</a></li>
</ul>

탭:
<ul class="tab-list" role="tablist">
  <li role="presentation"><a href="#tab1" class="current" role="tab" id="tab1" aria-selected="true" aria-controls="panel1">탭명</a></li>
</ul>
<div id="panel1" class="box on" role="tabpanel" aria-labelledby="tab1"></div>
<div id="panel2" class="box" role="tabpanel" aria-labelledby="tab2" hidden></div>

바로가기:
<ul class="quick-list"><li><a href="#">exactText</a></li></ul>

━━━ 접근성 ━━━
role 정확히 사용. 버튼 hid 포함. img alt 반드시 작성.

━━━ CSS 작성 규칙 ━━━
• 모든 스타일은 클래스 선택자(.클래스명 { })로만 작성
• HTML 태그에 style="" 속성 절대 금지
• 클래스명 예시: .MC_box1, .MC_box1 .slide-txt, .MC_box2 .card-list li 등 계층 선택자 활용
• JSON의 모든 bg·color·fontSize·fontWeight·padding·gap·borderRadius·shadow 값을 CSS 클래스에 반영

[단위 규칙 — 반드시 준수]
• CSS reset과 font-family는 작성하지 마라 (이미 외부 파일에 포함됨)
• html 기준 font-size: 20px (1rem = 20px)
• font-size, padding, margin, gap, line-height, letter-spacing 값은 반드시 rem 단위로 작성
  예) font-size: 16px → font-size: 0.8rem / padding: 40px → padding: 2rem / gap: 20px → gap: 1rem
• border-width(1px, 2px 등 얇은 선), box-shadow 수치, border-radius는 px 유지
• 섹션 컨테이너(.MC_box1, .MC_box2 등 최상위 섹션)의 width가 960px 이상이면 width: 100% 로 작성

━━━ 출력 형식 (필수 준수) ━━━
===HTML===
(순수 HTML만. style="" 속성 없음. class/id/role/aria/href/src/alt/type 속성만 허용.)
===CSS===
(순수 CSS만. style 태그 없음. 클래스 선택자 기반. px→rem 변환 적용.)
구분자 외 설명·주석·코드블럭 절대 금지.`;

/* ── 파서 ── */
function parseHtmlCss(raw) {
  const text = raw.trim().replace(/^```(?:html)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1');
  const htmlMatch = text.match(/===HTML===\s*([\s\S]*?)\s*===CSS===/);
  const cssMatch  = text.match(/===CSS===\s*([\s\S]*)$/);
  const html = htmlMatch ? htmlMatch[1].trim() : text;
  const css  = cssMatch  ? cssMatch[1].trim()  : '';
  return { html: stripInlineStyles(html), css: transformCss(css) };
}

/* ── 인라인 style 속성 강제 제거 ── */
function stripInlineStyles(html) {
  return html.replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
}

/* ── CSS 후처리: px→rem 변환 + 대형 width→100% ── */
function transformCss(css) {
  const BASE = 20; // html { font-size: 20px }

  // 1. 섹션 컨테이너의 960px 이상 width → 100%
  css = css.replace(/\bwidth\s*:\s*(\d+)px/g, (_, n) =>
    parseInt(n, 10) >= 960 ? 'width: 100%' : `width: ${n}px`
  );

  // 2. rem 변환 대상 속성
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
      if (num <= 1) return `${n}px`; // 1px 이하는 유지
      const rem = +(num / BASE).toFixed(4).replace(/\.?0+$/, '');
      return `${rem}rem`;
    });
    return `${prop}: ${converted}`;
  });

  return css;
}

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
    const userImg  = { inlineData: { mimeType, data: b64 } };

    /* ── Step 1: 시안 스캔 ── */
    const scanText = await vision(
      geminiKey, groqKey,
      SCAN_SYSTEM,
      [
        userImg,
        { text: '이 웹 디자인 시안을 스캔하라. 보이는 텍스트를 한 글자도 빠짐없이 그대로 복사하고, 모든 수치·색상·구조를 JSON 배열로 출력하라. 창작·요약·해석 금지.' },
      ],
      4096,
    );

    const scanJson = scanText.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1');

    /* ── Step 2: 더블체크 — JSON vs 시안 원본 대조 및 보정 ── */
    const verifyText = await vision(
      geminiKey, groqKey,
      VERIFY_SYSTEM,
      [
        userImg,
        {
          text: `아래 JSON이 이 시안을 올바르게 설명하는지 원본 이미지와 대조하여 검증하라.
누락된 섹션·잘못된 텍스트·틀린 색상·틀린 개수·슬라이더 미감지 등을 모두 수정하여 보정된 JSON 배열만 출력하라.

[검증 대상 JSON]
${scanJson}`,
        },
      ],
      4096,
    );

    const verifiedJson = verifyText.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/s, '$1');

    /* ── Step 3: HTML + CSS 생성 ── */
    const markupText = await vision(
      geminiKey, groqKey,
      MARKUP_SYSTEM,
      [
        userImg,
        {
          text: `아래 검증된 JSON이 이 시안의 유일한 콘텐츠 소스다.
JSON의 텍스트를 한 글자도 바꾸지 말고 그대로 사용하라.

준수 사항:
1. header / GNB / footer 절대 출력 금지
2. 첫 섹션이 메인비주얼이면 class="MC_box1 main-visual"
3. isSlider:true → swiper 구조 필수
4. JSON idx 순서대로 모든 섹션 빠짐없이 마크업
5. CSS에 JSON의 모든 색상·크기·여백·border·shadow 반영
6. div, p, span, a, button, ul, li, img 등 모든 요소에 style="..." 속성 절대 금지 — 모든 스타일은 CSS 클래스로만
7. 출력: ===HTML=== 다음 HTML, ===CSS=== 다음 CSS

[검증된 JSON]
${verifiedJson}`,
        },
      ],
      8192,
    );

    const { html, css } = parseHtmlCss(markupText);
    return Response.json({ html, css });
  } catch (e) {
    console.error('[image-markup] error:', e);
    return Response.json({ detail: e.message || '마크업 생성에 실패했습니다.' }, { status: 500 });
  }
}
