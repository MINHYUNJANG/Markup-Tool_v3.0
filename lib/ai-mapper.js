import Groq from 'groq-sdk';
import * as cheerio from 'cheerio';

let _client = null;

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama-3.1-8b-instant',
];

const CEREBRAS_MODELS = ['llama3.3-70b', 'llama3.1-8b'];
const MAX_CHARS = 12000;

function getClient() {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

function stripCodeFence(text) {
  return text.trim().replace(/^```(?:html)?\s*\n?(.*?)\n?```\s*$/s, '$1');
}

function truncateMessages(messages) {
  return messages.map(msg => {
    if (msg.role === 'user' && typeof msg.content === 'string' && msg.content.length > MAX_CHARS) {
      return { ...msg, content: msg.content.slice(0, MAX_CHARS) + '\n\n[내용이 너무 길어 일부 생략됨]' };
    }
    return msg;
  });
}

async function cerebrasChat(messages, maxTokens = 8192) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) throw new Error('CEREBRAS_API_KEY가 설정되지 않았습니다.');

  let lastError;
  for (const model of CEREBRAS_MODELS) {
    for (const msgs of [messages, truncateMessages(messages)]) {
      try {
        const resp = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens }),
        });
        if (!resp.ok) {
          lastError = new Error(`${resp.status}`);
          if ([429, 413].includes(resp.status)) break;
          throw lastError;
        }
        const data = await resp.json();
        return data.choices[0].message.content;
      } catch (e) {
        lastError = e;
      }
    }
  }
  throw new Error(`Cerebras 모든 모델에서 실패했습니다.\n(${lastError})`);
}

async function chat(messages, maxTokens = 8192) {
  const client = getClient();
  let lastError;

  for (const model of MODELS) {
    for (const msgs of [messages, truncateMessages(messages)]) {
      try {
        const result = await client.chat.completions.create({ model, max_tokens: maxTokens, messages: msgs });
        return stripCodeFence(result.choices[0].message.content);
      } catch (e) {
        lastError = e;
        const status = e?.status ?? e?.statusCode;
        if ([429, 413].includes(status)) break;
        if (status === 400 && String(e).includes('decommissioned')) break;
        throw e;
      }
    }
  }

  // Groq 소진 → Cerebras 폴백
  const status = lastError?.status ?? lastError?.statusCode;
  if ([429, 413].includes(status) && process.env.CEREBRAS_API_KEY) {
    return stripCodeFence(await cerebrasChat(messages, maxTokens));
  }
  if ([429, 413].includes(status)) {
    throw new Error('오늘 사용할 수 있는 AI 토큰이 모두 소진되었습니다.');
  }
  throw new Error(`모든 모델에서 실패했습니다. 잠시 후 다시 시도해주세요.\n(${lastError})`);
}

// ─── 시스템 프롬프트 ──────────────────────────────────────────
const SYSTEM_TEMPLATE = '당신은 HTML 마크업 전문가입니다. 사용자가 제공하는 HTML 템플릿에 크롤링된 데이터를 적절히 배치하여 완성된 HTML을 반환합니다. 반드시 완성된 HTML 코드만 반환하고, 설명은 생략하세요.';

const SYSTEM_AUTO = `당신은 HTML 마크업 전문가입니다.
원문 텍스트를 아래 규칙에 따라 정확히 마크업하여 HTML 소스만 반환합니다. 설명·주석·코드블록 없이 HTML만 출력하세요.

[마크업 규칙]
1. 타이틀은 레벨에 따라 순서대로:
   <h2 class="tit1"></h2>
   <h3 class="tit2"></h3>
   <h4 class="tit3"></h4>

2. 타이틀 하위 내용은 <div class="indent"></div>로 감싸서 들여쓰기

3. 일반 텍스트는 <p></p>

4. 일반 리스트(순서 없음)는 레벨에 따라:
   <ul class="list_st1"></ul>
   <ul class="list_st2"></ul>
   <ul class="list_st3"></ul>
   하위 리스트는 상위 <li> 안에 넣기

5. 숫자가 있는 순서 리스트는:
   <ol class="list_ol1"></ol>
   <ol class="list_ol2"></ol>
   숫자는 <span class="num">1</span> 형식으로 작성
   ①②③ 같은 원문자는 1, 2, 3으로 변환
   숫자 뒤 '.', ',' 등 구두점 제거

6. ○, -, ※ 등 특수문자로 시작하는 리스트 항목은 해당 특수문자 제거 후 <li>에 넣기

7. 테이블:
   - 원본 테이블 HTML이 제공된 경우 그 구조(thead/tbody/th/td/colspan/rowspan 등)를 그대로 유지
   - 반드시 아래 래퍼로 감싸기:
   <div class="tbl_st scroll_gr">
     <table>
       <caption>테이블 상위 타이틀과 주요 th 항목을 조합해 "OOO 테이블 입니다."형식으로 작성</caption>
       <colgroup><col><col>...</colgroup>
       <thead>...</thead>
       <tbody>...</tbody>
     </table>
   </div>
   - td 안에 리스트가 들어가는 경우 해당 td에 class="al" 추가
   - 기존 table 태그의 불필요한 속성(border, cellpadding, style 등)은 제거

8. 개인정보 처리절차 내용은:
   <div class="box_st2"><p class="rsp_img ac"><img src="/00_common/images/sub_com/img_personal1.png" alt=""></p></div>

9. 첫 부분에 "~바랍니다.", "~해주세요" 형태의 공지 문구가 있으면 <div class="box_st2">로 감싸기

10. 원문 텍스트는 절대 수정하지 말 것 (오타 포함 그대로 유지)
    - 단어 하나도 바꾸거나 고치지 말 것
    - 내용을 요약·축약·생략하지 말 것
    - 문단·항목의 순서를 임의로 바꾸지 말 것
    - 원문에 없는 내용을 추가하지 말 것
    - 원문의 모든 텍스트가 빠짐없이 출력에 포함되어야 함

11. section, div로 묶지 말 것 (규칙에 명시된 div 클래스 제외)

12. 모든 소스는 탭(\\t) 들여쓰기로 작성

13. 너무 길면 적당한 크기로 나눠서 제공하되, 계속 물어보지 말고 알아서 나눠서 제공`;

const SYSTEM_EDIT = `당신은 HTML 마크업 전문가입니다.
사용자가 제공하는 HTML 코드를 지시사항에 따라 수정하여 완성된 HTML 소스만 반환합니다.
설명·주석·코드블록 없이 HTML만 출력하세요.
원문 텍스트는 절대 수정하지 마세요. 요약·축약·생략·순서 변경·내용 추가 금지. 모든 원문 텍스트가 빠짐없이 출력에 포함되어야 합니다.`;

// ─── 후처리: colgroup 자동 생성 + td/th 내 불필요 태그 제거 ──
function postProcessMarkup(html) {
  const $ = cheerio.load(html);

  $('table').each((_, table) => {
    const $table = $(table);
    let maxCols = 0;

    $table.find('tr').each((_, row) => {
      let colCount = 0;
      $(row).find('td, th').each((_, cell) => {
        colCount += parseInt($(cell).attr('colspan') || '1', 10);
      });
      maxCols = Math.max(maxCols, colCount);
    });

    if (maxCols > 0) {
      $table.find('colgroup').remove();
      const width = Math.round(100 / maxCols);
      let cg = '<colgroup>';
      for (let k = 0; k < maxCols; k++) cg += `<col style="width:${width}%">`;
      cg += '</colgroup>';
      $table.prepend(cg);
    }

    $table.find('td, th').each((_, cell) => {
      $(cell).find('p').each((_, p) => $(p).replaceWith($(p).contents()));
      $(cell).find('span').each((_, span) => {
        if (!$(span).attr('class')) $(span).replaceWith($(span).contents());
      });
    });
  });

  const result = ($('body').html() || html).replace(/[ \t]{2,}/g, ' ');
  return tabIndent(result);
}

// ─── 탭 들여쓰기 ──────────────────────────────────────────────
function tabIndent(html) {
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data',
    'dfn', 'em', 'i', 'kbd', 'mark', 'q', 'rp', 'rt', 'ruby',
    's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time',
    'u', 'var', 'wbr']);
  const COLLAPSE = new Set(['th', 'td', 'caption', 'li', 'p', 'h2', 'h3', 'h4', 'dt', 'dd']);

  const tokens = [];
  for (const m of html.matchAll(/(<!--[\s\S]*?-->|<[^>]+>|[^<]+)/g)) {
    if (m[1].trim()) tokens.push(m[1]);
  }

  const lines = [];
  let depth = 0;
  let i = 0;

  while (i < tokens.length) {
    const s = tokens[i].trim();

    if (/^<\//.test(s)) {
      depth = Math.max(0, depth - 1);
      lines.push('\t'.repeat(depth) + s);
      i++;
      continue;
    }

    if (s.startsWith('<!--')) {
      lines.push('\t'.repeat(depth) + s);
      i++;
      continue;
    }

    const tagM = s.match(/^<(\w+)/);
    if (tagM) {
      const tn = tagM[1].toLowerCase();

      if (VOID.has(tn) || s.endsWith('/>')) {
        lines.push('\t'.repeat(depth) + s);
        i++;
        continue;
      }

      if (COLLAPSE.has(tn)) {
        let j = i + 1, nested = 0;
        const parts = [];
        let hasBlock = false, foundClose = false;

        while (j < tokens.length) {
          const t = tokens[j].trim();
          const cm = t.match(/^<\/(\w+)/);
          const om = t.match(/^<(\w+)/);

          if (cm) {
            const cn = cm[1].toLowerCase();
            if (nested === 0 && cn === tn) { foundClose = true; break; }
            nested--;
            parts.push(t);
          } else if (om) {
            const cn = om[1].toLowerCase();
            if (!INLINE.has(cn) && !VOID.has(cn)) hasBlock = true;
            if (!VOID.has(cn) && !t.endsWith('/>')) nested++;
            parts.push(t);
          } else {
            parts.push(t);
          }
          j++;
        }

        if (foundClose && !hasBlock) {
          lines.push('\t'.repeat(depth) + s + parts.join('') + tokens[j].trim());
          i = j + 1;
          continue;
        }
      }

      lines.push('\t'.repeat(depth) + s);
      depth++;
      i++;
      continue;
    }

    if (s) lines.push('\t'.repeat(depth) + s);
    i++;
  }

  return lines.join('\n');
}

// ─── HTML 클린 (테이블 전처리용) ──────────────────────────────
function cleanHtml(html) {
  const $ = cheerio.load(html);
  $('script, style').remove();
  $('*').contents().each(function () {
    if (this.nodeType === 8) $(this).remove();
  });
  const keepAttrs = new Set(['colspan', 'rowspan', 'scope', 'headers', 'class', 'id', 'href', 'src', 'alt']);
  $('*').each((_, el) => {
    for (const attr of Object.keys(el.attribs || {})) {
      if (!keepAttrs.has(attr)) $(el).removeAttr(attr);
    }
  });
  return ($('body').html() || html)
    .replace(/\n\s*\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// ─── 공개 API ─────────────────────────────────────────────────
export async function editMarkup(html, instruction) {
  const prompt = `다음 HTML을 아래 지시사항에 따라 수정해주세요.\n\n[지시사항]\n${instruction}\n\n[HTML]\n${html}`;
  const result = await chat([
    { role: 'system', content: SYSTEM_EDIT },
    { role: 'user', content: prompt },
  ]);
  return postProcessMarkup(result);
}

export function mapToTemplate(templateHtml, crawledData) {
  const images = crawledData.images || [];
  let imageSection = '';
  if (images.length) {
    const lines = images.map(img =>
      `- src: ${img.src}\n  alt: ${img.alt}\n  OCR 텍스트: ${img.ocr_text}`
    );
    imageSection = '\n\n이미지 OCR 결과:\n' + lines.join('\n');
  }

  const prompt = `다음 HTML 템플릿에 크롤링된 데이터를 배치해주세요.\n\n[HTML 템플릿]\n${templateHtml}\n\n[크롤링된 데이터]\n텍스트:\n${crawledData.text}${imageSection}\n\n원본 HTML:\n${crawledData.html}\n\n템플릿의 구조를 유지하면서 크롤링된 데이터를 적절한 위치에 배치한 완성된 HTML을 반환해주세요.`;

  return chat([
    { role: 'system', content: SYSTEM_TEMPLATE },
    { role: 'user', content: prompt },
  ]);
}

export async function autoMarkup(crawledData) {
  const rawHtml = crawledData.html || '';
  const text = crawledData.text || '';

  const $ = cheerio.load(rawHtml);
  const hasTable = $('table').length > 0;

  const images = crawledData.images || [];
  const ocrLines = images.map(img => img.ocr_text).filter(Boolean);
  const ocrSection = ocrLines.length ? '\n\n[이미지 OCR 텍스트]\n' + ocrLines.join('\n') : '';

  let content;
  if (hasTable) {
    const cleaned = cleanHtml(rawHtml);
    content =
      '다음 원본 HTML을 마크업 규칙에 따라 변환해주세요.\n' +
      '테이블은 반드시 원본 구조(th, td, rowspan, colspan 등)를 그대로 유지하고 규칙의 래퍼 클래스만 적용하세요.\n' +
      '테이블을 절대 리스트나 p 태그로 변환하지 마세요.\n' +
      '원문 텍스트는 절대 수정·요약·생략·재배치하지 말고 모든 내용을 빠짐없이 그대로 출력하세요.\n\n' +
      `[원본 HTML]\n${cleaned}${ocrSection}`;
  } else {
    content =
      '다음 원문을 마크업해주세요.\n' +
      '원문 텍스트는 절대 수정·요약·생략·재배치하지 말고 모든 내용을 빠짐없이 그대로 출력하세요.\n\n' +
      `${text}${ocrSection}`;
  }

  const result = await chat([
    { role: 'system', content: SYSTEM_AUTO },
    { role: 'user', content: content },
  ]);
  return postProcessMarkup(result);
}
