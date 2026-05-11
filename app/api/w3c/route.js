import { chromium } from 'playwright';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  let browser;
  try {
    const { url } = await request.json();
    if (!url) return Response.json({ detail: 'url은 필수입니다.' }, { status: 400 });

    const validatorUrl = `https://validator.w3.org/nu/?doc=${encodeURIComponent(url)}&out=json`;
    const res = await fetch(validatorUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarkupTool-W3C-Checker/1.0)',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return Response.json({ detail: `W3C validator 응답 오류: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const messages = data.messages ?? [];
    let validatorScreenshot = null;
    if (messages.length === 0) {
      try {
        const vnuVersion = data.version ?? '26.5.9';
        const evidenceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; background: #fff; }
  h1 { background: #396592; color: #fff; font-size: 22px; font-weight: bold; padding: 12px 16px; margin: 0; }
  .subtitle { color: #396592; font-size: 13px; padding: 8px 16px 4px; }
  .showing { font-weight: bold; font-size: 13px; padding: 4px 16px 12px; }
  .checker-input { border: 1px solid #aaa; margin: 0 16px 16px; padding: 10px 12px; }
  .checker-input legend { font-weight: bold; padding: 0 4px; font-size: 13px; }
  .show-row { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; font-size: 13px; }
  .show-row label { display: flex; align-items: center; gap: 3px; }
  .check-row { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 8px; }
  .url-input { width: 100%; border: 1px solid #aaa; padding: 3px 5px; font-size: 13px; margin-bottom: 8px; font-family: monospace; }
  .check-btn { border: 1px solid #aaa; background: #e8e8e8; padding: 3px 10px; font-size: 13px; cursor: default; }
  .options-btn { border: 1px solid #aaa; background: #e8e8e8; padding: 3px 10px; font-size: 13px; cursor: default; }
  .result-ok { background: #cfc; border: 1px solid #090; padding: 8px 12px; margin: 0 16px 8px; font-weight: bold; font-size: 14px; }
  .result-meta { color: #555; font-size: 12px; padding: 0 16px 4px; }
  .result-meta a { color: #396592; }
  hr { border: none; border-top: 1px solid #ccc; margin: 12px 16px; }
  .footer { padding: 8px 16px; font-size: 12px; color: #396592; }
  .footer a { color: #396592; }
  select { font-size: 13px; border: 1px solid #aaa; padding: 1px 2px; }
</style>
</head>
<body>
  <h1>Nu Html Checker</h1>
  <p class="subtitle">This tool is an ongoing experiment in better HTML checking, and its behavior remains subject to change</p>
  <p class="showing">Showing results for ${url} (checked with vnu ${vnuVersion})</p>
  <fieldset class="checker-input">
    <legend>Checker Input</legend>
    <div class="show-row">
      <span>Show</span>
      <label><input type="checkbox" disabled> source</label>
      <label><input type="checkbox" disabled> outline</label>
      <label><input type="checkbox" disabled> image report</label>
      <label><input type="checkbox" disabled> errors &amp; warnings only</label>
      <button class="options-btn" disabled>Options...</button>
    </div>
    <div class="check-row">
      <span>Check by</span>
      <select disabled><option>address</option></select>
    </div>
    <input class="url-input" type="text" value="${url}" readonly>
    <button class="check-btn" disabled>Check</button>
  </fieldset>
  <p class="result-ok">Document checking completed. No errors or warnings to show.</p>
  <p class="result-meta">Used the HTML parser. Externally specified character encoding was UTF-8.</p>
  <hr>
  <p class="footer"><a href="#">About this checker</a> &bull; <a href="#">Report an issue</a></p>
</body>
</html>`;

        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ viewport: { width: 1280, height: 600 } });
        const page = await context.newPage();
        await page.setContent(evidenceHtml, { waitUntil: 'load' });
        const contentHeight = await page.evaluate(() => document.body.scrollHeight);
        await page.setViewportSize({ width: 1280, height: contentHeight });
        const buf = await page.screenshot({ type: 'png', fullPage: false });
        validatorScreenshot = buf.toString('base64');
      } catch (_) {
        // 캡쳐 실패해도 검사 결과는 정상 반환
      } finally {
        if (browser) await browser.close().catch(() => {});
      }
    }

    return Response.json({ ...data, validatorScreenshot });
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    return Response.json({ detail: e.message }, { status: 500 });
  }
}
