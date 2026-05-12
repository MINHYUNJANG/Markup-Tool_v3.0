const REM = 20;

function toRem(str) {
  if (!str) return str;
  return String(str).replace(/(\d+(?:\.\d+)?)px/g, (_, n) => {
    const num = parseFloat(n);
    if (num === 0) return '0';
    if (num <= 1) return `${n}px`;
    const rem = +(num / REM).toFixed(4).replace(/\.?0+$/, '');
    return `${rem}rem`;
  });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) {
  return String(s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function ind(s, n = 1) {
  if (!s.trim()) return s;
  return s.split('\n').map(l => '\t'.repeat(n) + l).join('\n');
}

// ── 요소 → HTML ──────────────────────────────────────────────
function renderEl(el, pfx) {
  const t = el.text || '';
  const items = el.items || [];
  const count = el.count || items.length || 1;

  switch (el.role) {
    case 'heading':
      return `<${el.tag || 'h2'} class="${pfx}-tit">${esc(t)}</${el.tag || 'h2'}>`;
    case 'subheading':
      return `<${el.tag || 'h3'} class="${pfx}-sub">${esc(t)}</${el.tag || 'h3'}>`;
    case 'label':
      return `<p class="${pfx}-label">${esc(t)}</p>`;
    case 'text':
      return `<p class="${pfx}-txt">${esc(t)}</p>`;
    case 'button':
      return `<button type="button" class="${pfx}-btn">${esc(t)}</button>`;
    case 'link':
      return `<a href="#" class="${pfx}-link">${esc(t)}</a>`;
    case 'image':
      return `<span class="${pfx}-img img"><img src="" alt="${escAttr(t)}"></span>`;
    case 'icon':
      return `<span class="${pfx}-icon" aria-hidden="true"></span>`;
    case 'badge':
      return `<span class="${pfx}-badge">${esc(t)}</span>`;
    case 'date':
      return `<span class="${pfx}-date">${esc(t)}</span>`;
    case 'count':
      return `<strong class="${pfx}-count">${esc(t)}</strong>`;
    case 'input':
      return `<input type="text" class="${pfx}-input" placeholder="${escAttr(t)}" aria-label="${escAttr(t)}">`;
    case 'tab-list': {
      if (!items.length) return '';
      const lis = items.map((item, i) => {
        const n = i + 1;
        const cur = i === 0;
        return `\t<li role="presentation"><a href="#${pfx}-tab${n}"${cur ? ' class="current"' : ''} role="tab" id="${pfx}-tab${n}" aria-selected="${cur}" aria-controls="${pfx}-panel${n}">${esc(item)}</a></li>`;
      }).join('\n');
      const panels = items.map((_, i) => {
        const n = i + 1;
        return `<div id="${pfx}-panel${n}" class="box${i === 0 ? ' on' : ''}" role="tabpanel" aria-labelledby="${pfx}-tab${n}"${i > 0 ? ' hidden' : ''}></div>`;
      }).join('\n');
      return `<ul class="tab-list" role="tablist">\n${lis}\n</ul>\n${panels}`;
    }
    case 'list': {
      const lis = items.length
        ? items.map(item => `\t<li><a href="#">${esc(item)}</a></li>`).join('\n')
        : Array.from({ length: count }, (_, i) => `\t<li><a href="#">항목 ${i + 1}</a></li>`).join('\n');
      return `<ul class="list" role="list">\n${lis}\n</ul>`;
    }
    case 'pagination':
      return `<div class="${pfx}-pagination" aria-label="페이지 목록">\n\t<button type="button" class="btn-prev"><span class="hid">이전</span></button>\n\t<button type="button" class="btn-next"><span class="hid">다음</span></button>\n</div>`;
    default:
      return t ? `<p class="${pfx}-txt">${esc(t)}</p>` : '';
  }
}

// ── Swiper ───────────────────────────────────────────────────
function renderSwiper(section) {
  const n = section.slideCount || 1;
  const dots = section.hasDots !== false;
  const slides = Array.from({ length: n }, () => `\t\t<div class="swiper-slide"></div>`).join('\n');
  const lines = [
    `<div class="swiper">`,
    `\t<div class="swiper-wrapper">`,
    slides,
    `\t</div>`,
    `\t<button type="button" class="btn-prev"><span class="hid">이전</span></button>`,
    `\t<button type="button" class="btn-next"><span class="hid">다음</span></button>`,
    dots ? `\t<div class="swiper-pagination"></div>` : null,
    `</div>`,
  ];
  return lines.filter(l => l !== null).join('\n');
}

// ── 카드 그리드 ─────────────────────────────────────────────
function renderCardGrid(section, pfx) {
  const els = section.elements || [];
  const headEls = els.filter(e => ['heading', 'subheading', 'label'].includes(e.role));
  const cards = section.cards || [];
  const listEl = els.find(e => e.role === 'list' || (e.items && e.items.length));

  let cardList;
  if (cards.length) {
    const lis = cards.map(card => {
      const inner = (card.elements || []).map(e => renderEl(e, `${pfx}-card`)).filter(Boolean).join('\n');
      return `\t<li>\n${ind(inner, 2)}\n\t</li>`;
    }).join('\n');
    cardList = `<ul class="card-list">\n${lis}\n</ul>`;
  } else if (listEl) {
    const items = listEl.items || [];
    const count = listEl.count || items.length || 3;
    const lis = items.length
      ? items.map(item => `\t<li>${esc(item)}</li>`).join('\n')
      : Array.from({ length: count }, (_, i) => `\t<li>카드 ${i + 1}</li>`).join('\n');
    cardList = `<ul class="card-list">\n${lis}\n</ul>`;
  } else {
    cardList = `<ul class="card-list"></ul>`;
  }

  return [...headEls.map(e => renderEl(e, pfx)), cardList].filter(Boolean).join('\n');
}

// ── 퀵메뉴 ──────────────────────────────────────────────────
function renderQuickMenu(section, pfx) {
  const els = section.elements || [];
  const listEl = els.find(e => e.role === 'list' || (e.items && e.items.length));
  const others = els.filter(e => e !== listEl);
  const items = listEl?.items || [];
  const count = listEl?.count || items.length || 1;
  const lis = items.length
    ? items.map(item => `\t<li><a href="#">${esc(item)}</a></li>`).join('\n')
    : Array.from({ length: count }, (_, i) => `\t<li><a href="#">메뉴 ${i + 1}</a></li>`).join('\n');
  return [
    ...others.map(e => renderEl(e, pfx)),
    `<ul class="quick-list">\n${lis}\n</ul>`,
  ].filter(Boolean).join('\n');
}

const FRAME_TYPES = new Set(['header', 'footer']);

// header/footer는 MC_box 번호에서 제외
function getPrefix(section, contentIdx) {
  if (section.type === 'header') return 'header';
  if (section.type === 'footer') return 'footer';
  return `MC_box${contentIdx}`;
}

// ── 섹션 → HTML ─────────────────────────────────────────────
function renderSection(section, pfx) {
  const isMainVisual = section.type === 'main-visual' && pfx === 'MC_box1';
  const wrapClass = isMainVisual ? `${pfx} main-visual` : pfx;

  let inner = '';
  if (section.isSlider) {
    inner = renderSwiper(section);
  } else if (section.type === 'quick-menu') {
    inner = renderQuickMenu(section, pfx);
  } else if (section.type === 'card-grid' || section.type === 'gallery') {
    inner = renderCardGrid(section, pfx);
  } else {
    inner = (section.elements || []).map(e => renderEl(e, pfx)).filter(Boolean).join('\n');
  }

  if (!inner.trim()) return '';

  // header/footer는 <div class="header/footer">, 그 외는 <div class="MC_boxN">
  const tag = FRAME_TYPES.has(section.type) ? 'div' : 'div';
  return `<${tag} class="${wrapClass}">\n${ind(inner)}\n</${tag}>`;
}

// ── 섹션 → CSS ──────────────────────────────────────────────
function buildCss(section, pfx) {
  let css = '';
  const layout = section.layout || {};

  // wrapper: bg, padding, flex(quick-menu 제외)
  const sRules = [];
  if (section.bg) sRules.push(`background-color: ${section.bg}`);
  if (section.padding) sRules.push(`padding: ${toRem(section.padding)}`);
  if (layout.type === 'flex' && section.type !== 'quick-menu') {
    sRules.push('display: flex');
    if (layout.direction) sRules.push(`flex-direction: ${layout.direction}`);
    if (layout.alignItems) sRules.push(`align-items: ${layout.alignItems}`);
    if (layout.justifyContent) sRules.push(`justify-content: ${layout.justifyContent}`);
    if (layout.gap) sRules.push(`gap: ${toRem(layout.gap)}`);
  }
  const block = (sel, rules) => rules.length ? `${sel} { ${rules.map(r => `${r};`).join(' ')} }\n` : '';

  css += block(`.${pfx}`, sRules);

  // quick-menu: flex를 .quick-list에 적용
  if (section.type === 'quick-menu') {
    const qr = ['display: flex'];
    if (layout.direction === 'column') qr.push('flex-direction: column');
    else qr.push('flex-direction: row', 'flex-wrap: wrap');
    if (layout.justifyContent) qr.push(`justify-content: ${layout.justifyContent}`);
    if (layout.gap) qr.push(`gap: ${toRem(layout.gap)}`);
    css += block(`.${pfx} .quick-list`, qr);
  }

  // card-grid / gallery: grid를 .card-list에 적용
  const isGrid = layout.type === 'grid' || ['card-grid', 'gallery'].includes(section.type);
  if (isGrid) {
    const cols = layout.cols || 3;
    const gr = ['display: grid', `grid-template-columns: repeat(${cols}, 1fr)`];
    if (layout.gap) gr.push(`gap: ${toRem(layout.gap)}`);
    css += block(`.${pfx} .card-list`, gr);
  }

  // 요소별 CSS
  const ROLE_SUFFIX = {
    heading: 'tit', subheading: 'sub', text: 'txt', label: 'label',
    button: 'btn', link: 'link', image: 'img', badge: 'badge', date: 'date', count: 'count',
  };
  (section.elements || []).forEach(el => {
    const suffix = ROLE_SUFFIX[el.role];
    if (!suffix) return;
    const rules = [];
    if (el.fontSize) rules.push(`font-size: ${toRem(el.fontSize)}`);
    if (el.fontWeight) rules.push(`font-weight: ${el.fontWeight}`);
    if (el.color) rules.push(`color: ${el.color}`);
    if (el.bg) rules.push(`background-color: ${el.bg}`);
    if (el.padding) rules.push(`padding: ${toRem(el.padding)}`);
    if (el.borderRadius) rules.push(`border-radius: ${el.borderRadius}`);
    if (el.border && el.border !== 'none') rules.push(`border: ${el.border}`);
    if (el.shadow && el.shadow !== 'none') rules.push(`box-shadow: ${el.shadow}`);
    if (el.gap) rules.push(`gap: ${toRem(el.gap)}`);
    if (el.w) {
      const n = parseFloat(String(el.w));
      rules.push(`width: ${!isNaN(n) && n >= 960 ? '100%' : el.w}`);
    }
    if (el.h) rules.push(`height: ${el.h}`);
    css += block(`.${pfx}-${suffix}`, rules);
  });

  return css;
}

// ── 메인 export ────────────────────────────────────────────
export function generateHtmlCss(layoutJson) {
  const sections = layoutJson?.sections || [];

  // header/footer는 MC_box 번호에서 제외하고 별도 카운터 사용
  let contentIdx = 1;
  const prefixes = sections.map(s => {
    const pfx = getPrefix(s, contentIdx);
    if (!FRAME_TYPES.has(s.type)) contentIdx++;
    return pfx;
  });

  const html = sections
    .map((s, i) => renderSection(s, prefixes[i]))
    .filter(Boolean)
    .join('\n\n');

  const css = sections
    .map((s, i) => buildCss(s, prefixes[i]))
    .filter(Boolean)
    .join('\n');

  return { html, css };
}
