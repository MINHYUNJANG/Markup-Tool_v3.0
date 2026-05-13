const REM = 20;

// ── componentMap: 이미지 기반 컴포넌트 분류표 ──────────────────
const componentMap = {
  '#header': 'layoutHeader',
  '.topUtil': 'headerUtility',
  '#gnb': 'navigationGnb',
  '#mNav': 'navigationMobile',
  '.MVisual0038': 'mainVisualSlider',
  '.visual .slider': 'swiperContainer',
  '.visual .control': 'swiperController',
  '.M_link0038': 'quickLinkGrid',
  '.M_link0038 ul': 'quickLinkList',
  '.M_link0038 li': 'quickLinkItem',
  '.notice0038': 'boardNotice',
  '.notice0038 .titTab': 'boardTabNavigation',
  '.notice0038 .list_box': 'boardListWrap',
  '.gallery0038': 'galleryBoard',
  '.gallery0038 .list_box': 'galleryListWrap',
  '.pop0038': 'popupZone',
  '.pop0038 .control': 'popupController',
  '.pop_schedule0038': 'scheduleCalendar',
  '.pop_schedule0038 .lst': 'scheduleList',
  '.meal_menu0038': 'mealMenuWidget',
  '.banner_zone': 'bannerSliderZone',
  '.bnWrap': 'bannerSlider',
  '#footer': 'layoutFooter',
  '.footer_link': 'footerLinkList',
};

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

// '0', '0px', '0 0 0 0' 등 모두 zero로 판단
function isZeroSpacing(raw) {
  if (!raw) return true;
  return toRem(String(raw)).split(/\s+/).every(p => p === '0');
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

// ── CSS 변수 수집 ────────────────────────────────────────────
function buildVarMaps(sections) {
  const colors = new Map();   // rawValue → --clr-N
  const spacings = new Map(); // remValue → --spc-N
  const radii = new Map();    // rawValue → --rad-N
  const shadows = new Map();  // rawValue → --shd-N
  let ci = 1, si = 1, ri = 1, shi = 1;

  const isColor = v => v && /^#[0-9a-fA-F]{3,8}$|^rgba?\(/.test(v);

  const addColor = v => {
    if (!isColor(v) || colors.has(v)) return;
    colors.set(v, `--clr-${ci++}`);
  };
  const addSpacing = raw => {
    if (!raw || isZeroSpacing(raw)) return;
    const v = toRem(raw);
    if (!v || spacings.has(v)) return;
    spacings.set(v, `--spc-${si++}`);
  };
  const addRadius = v => {
    if (!v || v === '0' || v === 'none' || radii.has(v)) return;
    radii.set(v, `--rad-${ri++}`);
  };
  const addShadow = v => {
    if (!v || v === 'none' || shadows.has(v)) return;
    shadows.set(v, `--shd-${shi++}`);
  };

  for (const s of sections) {
    addColor(s.bg);
    addSpacing(s.padding);
    addSpacing(s.layout?.gap);
    for (const el of (s.elements || [])) {
      addColor(el.color);
      addColor(el.bg);
      addSpacing(el.padding);
      addSpacing(el.gap);
      addRadius(el.borderRadius);
      addShadow(el.shadow);
    }
    for (const card of (s.cards || [])) {
      for (const el of (card.elements || [])) {
        addColor(el.color);
        addColor(el.bg);
        addSpacing(el.padding);
        addRadius(el.borderRadius);
        addShadow(el.shadow);
      }
    }
  }

  return { colors, spacings, radii, shadows };
}

function buildCssRoot({ colors, spacings, radii, shadows }) {
  const rules = [];
  colors.forEach((varName, val) => rules.push(`\t${varName}: ${val};`));
  spacings.forEach((varName, val) => rules.push(`\t${varName}: ${val};`));
  radii.forEach((varName, val) => rules.push(`\t${varName}: ${val};`));
  shadows.forEach((varName, val) => rules.push(`\t${varName}: ${val};`));
  if (!rules.length) return '';
  return `:root {\n${rules.join('\n')}\n}`;
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

  return `<div class="${wrapClass}">\n${ind(inner)}\n</div>`;
}

// ── 섹션 → CSS 라인 배열 ────────────────────────────────────
function buildCssLines(section, pfx, varMaps) {
  const { colors, spacings, radii, shadows } = varMaps;
  const lines = [];

  // CSS 변수 참조 헬퍼
  const cv  = v   => (v && colors.has(v))   ? `var(${colors.get(v)})`   : v;
  const sv  = raw => { if (!raw) return raw; const v = toRem(raw); return spacings.has(v) ? `var(${spacings.get(v)})` : v; };
  const rv  = v   => (v && radii.has(v))    ? `var(${radii.get(v)})`    : v;
  const shv = v   => (v && shadows.has(v))  ? `var(${shadows.get(v)})` : v;

  const push = (sel, rules) => { if (rules.length) lines.push(`${sel} { ${rules.map(r => `${r};`).join(' ')} }`); };
  const layout = section.layout || {};

  // 섹션 wrapper
  const sRules = [];
  if (section.bg) sRules.push(`background-color: ${cv(section.bg)}`);
  if (section.padding && !isZeroSpacing(section.padding)) sRules.push(`padding: ${sv(section.padding)}`);
  if (layout.type === 'flex' && section.type !== 'quick-menu') {
    sRules.push('display: flex');
    // flex-direction: row 는 기본값이므로 생략
    if (layout.direction && layout.direction !== 'row') sRules.push(`flex-direction: ${layout.direction}`);
    // align-items: stretch/normal 은 기본값이므로 생략
    if (layout.alignItems && layout.alignItems !== 'stretch' && layout.alignItems !== 'normal')
      sRules.push(`align-items: ${layout.alignItems}`);
    // justify-content: flex-start/normal 은 기본값이므로 생략
    if (layout.justifyContent && layout.justifyContent !== 'flex-start' && layout.justifyContent !== 'normal')
      sRules.push(`justify-content: ${layout.justifyContent}`);
    if (layout.gap && !isZeroSpacing(layout.gap)) sRules.push(`gap: ${sv(layout.gap)}`);
  }
  push(`.${pfx}`, sRules);

  // quick-menu: flex를 .quick-list에 적용
  if (section.type === 'quick-menu') {
    const qr = ['display: flex'];
    if (layout.direction === 'column') qr.push('flex-direction: column');
    else qr.push('flex-wrap: wrap'); // flex-direction: row 는 기본값 생략
    if (layout.justifyContent && layout.justifyContent !== 'flex-start')
      qr.push(`justify-content: ${layout.justifyContent}`);
    if (layout.gap && !isZeroSpacing(layout.gap)) qr.push(`gap: ${sv(layout.gap)}`);
    push(`.${pfx} .quick-list`, qr);
  }

  // card-grid / gallery: grid를 .card-list에 적용
  const isGrid = layout.type === 'grid' || ['card-grid', 'gallery'].includes(section.type);
  if (isGrid) {
    const cols = layout.cols || 3;
    const gr = ['display: grid', `grid-template-columns: repeat(${cols}, 1fr)`];
    if (layout.gap && !isZeroSpacing(layout.gap)) gr.push(`gap: ${sv(layout.gap)}`);
    push(`.${pfx} .card-list`, gr);
  }

  // 요소별 CSS (같은 셀렉터 중복 방지)
  const ROLE_SUFFIX = {
    heading: 'tit', subheading: 'sub', text: 'txt', label: 'label',
    button: 'btn', link: 'link', image: 'img', badge: 'badge', date: 'date', count: 'count',
  };
  const seenSel = new Set();
  (section.elements || []).forEach(el => {
    const suffix = ROLE_SUFFIX[el.role];
    if (!suffix) return;
    const sel = `.${pfx}-${suffix}`;
    if (seenSel.has(sel)) return;
    seenSel.add(sel);

    const rules = [];
    if (el.fontSize) rules.push(`font-size: ${toRem(el.fontSize)}`);
    // font-weight: 400/normal 은 기본값이므로 생략
    if (el.fontWeight && el.fontWeight !== '400' && el.fontWeight !== 'normal')
      rules.push(`font-weight: ${el.fontWeight}`);
    if (el.color) rules.push(`color: ${cv(el.color)}`);
    if (el.bg) rules.push(`background-color: ${cv(el.bg)}`);
    if (el.padding && !isZeroSpacing(el.padding)) rules.push(`padding: ${sv(el.padding)}`);
    if (el.borderRadius && el.borderRadius !== '0') rules.push(`border-radius: ${rv(el.borderRadius)}`);
    // border: 0/none 은 기본값이므로 생략
    if (el.border && el.border !== 'none' && el.border !== '0') rules.push(`border: ${el.border}`);
    if (el.shadow && el.shadow !== 'none') rules.push(`box-shadow: ${shv(el.shadow)}`);
    if (el.gap && !isZeroSpacing(el.gap)) rules.push(`gap: ${sv(el.gap)}`);
    // width: auto / height: auto 는 기본값이므로 생략
    if (el.w && el.w !== 'auto') {
      const n = parseFloat(String(el.w));
      rules.push(`width: ${!isNaN(n) && n >= 960 ? '100%' : el.w}`);
    }
    if (el.h && el.h !== 'auto') rules.push(`height: ${el.h}`);
    push(sel, rules);
  });

  return lines;
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

  // CSS 변수 맵 생성 → :root 블록
  const varMaps = buildVarMaps(sections);
  const rootBlock = buildCssRoot(varMaps);

  // CSS 라인 수집 후 전역 중복 제거
  const seen = new Set();
  const cssLines = sections
    .flatMap((s, i) => buildCssLines(s, prefixes[i], varMaps))
    .filter(line => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });

  const css = [rootBlock, ...cssLines].filter(Boolean).join('\n');

  return { html, css };
}
