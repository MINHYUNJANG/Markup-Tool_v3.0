import { chromium } from 'playwright';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCssResultHtml(url, errorCount, warningCount) {
  const hasErrors = errorCount > 0;
  const navParts = [];
  if (warningCount > 0) navParts.push(`<a href="#">경고 (${warningCount})</a>`);
  navParts.push('<a href="#">검사 된 CSS</a>');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; background: #fff; }
  .header { background: #005a9c; color: #fff; padding: 10px 20px; display: flex; align-items: center; gap: 12px; }
  .header-logo { background: #fff; color: #005a9c; font-weight: bold; font-size: 12px; padding: 2px 5px; border: 2px solid #acd; line-height: 1.3; text-align: center; }
  .header-logo .css { display: block; font-size: 10px; color: #888; }
  .header-title { font-size: 20px; font-weight: bold; }
  .subtitle { color: #005a9c; font-size: 13px; padding: 8px 16px 2px; font-weight: bold; }
  .nav { padding: 2px 16px 8px; font-size: 13px; color: #555; }
  .nav a { color: #005a9c; text-decoration: none; margin-right: 6px; }
  .result-ok  { background: #cfc; border: 1px solid #090; padding: 8px 12px; margin: 6px 16px; font-weight: bold; font-size: 14px; color: #060; }
  .result-err { background: #fdd; border: 1px solid #c00; padding: 8px 12px; margin: 6px 16px; font-weight: bold; font-size: 14px; color: #900; }
  .info { padding: 4px 16px 8px; font-size: 13px; color: #555; }
  hr { border: none; border-top: 1px solid #ccc; margin: 8px 16px 12px; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-logo">W3C<span class="css">CSS</span></div>
    <span class="header-title">W3C CSS 검사 서비스</span>
  </div>
  <p class="subtitle">W3C CSS 검사 결과 ${xmlEscape(url)} (CSS 레벨 3 + SVG)</p>
  <p class="nav">이동: ${navParts.join(', ')}</p>
  ${hasErrors
    ? `<p class="result-err">이 문서에서 오류가 발견됐습니다! 오류 ${errorCount}개${warningCount > 0 ? `, 경고 ${warningCount}개` : ''}</p>`
    : `<p class="result-ok">축하합니다! 발견된 오류가 없습니다.</p>`}
  <p class="info">이 문서는 다음 형식으로 검사되었습니다: CSS 레벨 3 + SVG</p>
  <hr>
</body>
</html>`;
}

export async function POST(request) {
  let browser;
  try {
    const { url } = await request.json();
    if (!url) return Response.json({ detail: 'url은 필수입니다.' }, { status: 400 });

    const validatorApiUrl =
      `https://jigsaw.w3.org/css-validator/validator?uri=${encodeURIComponent(url)}&output=json`;

    const res = await fetch(validatorApiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarkupTool/1.0)' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return Response.json({ detail: `CSS 검사기 응답 오류: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const cssvalidation = data.cssvalidation ?? {};
    const result = cssvalidation.result ?? {};

    const errorCount = result.errorcount ?? 0;
    const warningCount = result.warningcount ?? 0;

    // errors/warnings are direct arrays under cssvalidation
    let errors = cssvalidation.errors ?? [];
    let warnings = cssvalidation.warnings ?? [];
    if (!Array.isArray(errors)) errors = errors ? [errors] : [];
    if (!Array.isArray(warnings)) warnings = warnings ? [warnings] : [];

    let cssScreenshot = null;
    try {
      const evidenceHtml = buildCssResultHtml(url, errorCount, warningCount);
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ viewport: { width: 1280, height: 600 } });
      const page = await context.newPage();
      await page.setContent(evidenceHtml, { waitUntil: 'load' });
      const contentHeight = await page.evaluate(() => document.body.scrollHeight);
      await page.setViewportSize({ width: 1280, height: contentHeight });
      const buf = await page.screenshot({ type: 'png', fullPage: false });
      cssScreenshot = buf.toString('base64');
    } catch (_) {
      // 캡처 실패해도 검사 결과는 반환
    } finally {
      if (browser) await browser.close().catch(() => {});
    }

    return Response.json({ errors, warnings, errorCount, warningCount, cssScreenshot });
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    return Response.json({ detail: e.message }, { status: 500 });
  }
}
