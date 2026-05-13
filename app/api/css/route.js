import { chromium } from 'playwright';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  let browser;
  try {
    const { url } = await request.json();
    if (!url) return Response.json({ detail: 'url은 필수입니다.' }, { status: 400 });

    // JSON API로 오류/경고 데이터 수집
    const apiUrl = `https://jigsaw.w3.org/css-validator/validator?uri=${encodeURIComponent(url)}&output=json`;
    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarkupTool/1.0)' },
      signal: AbortSignal.timeout(30000),
    });

    if (!apiRes.ok) {
      return Response.json({ detail: `CSS 검사기 응답 오류: ${apiRes.status}` }, { status: 502 });
    }

    const data = await apiRes.json();
    const cssvalidation = data.cssvalidation ?? {};
    const result = cssvalidation.result ?? {};

    const errorCount = result.errorcount ?? 0;
    const warningCount = result.warningcount ?? 0;

    let errors = cssvalidation.errors ?? [];
    let warnings = cssvalidation.warnings ?? [];
    if (!Array.isArray(errors)) errors = errors ? [errors] : [];
    if (!Array.isArray(warnings)) warnings = warnings ? [warnings] : [];

    // 실제 W3C CSS Validator 페이지 캡처
    // warning=0 으로 경고 목록 숨겨서 결과 상단만 깔끔하게 캡처
    let cssScreenshot = null;
    try {
      const pageUrl = `https://jigsaw.w3.org/css-validator/validator?uri=${encodeURIComponent(url)}&lang=ko&warning=0`;
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(500);

      // 경고 카운트가 있으면 워닝 수치는 별도로 알고 있으니, 페이지에서 불필요한 하단 콘텐츠 제거
      await page.evaluate(() => {
        // results 이후 형제 및 불필요한 섹션 제거
        const toRemove = [
          '#results ~ *',
          '.boxtitle',
          'table.cssSource',
          '#footer',
          'div.footer',
          '#parsedSection',
        ];
        toRemove.forEach(sel => {
          try { document.querySelectorAll(sel).forEach(el => el.remove()); } catch (_) {}
        });
        const results = document.getElementById('results');
        if (results) {
          let next = results.nextElementSibling;
          while (next) {
            const toDelete = next;
            next = next.nextElementSibling;
            toDelete.remove();
          }
          // results 내 오류·경고 상세 목록 제거 (요약 배너만 남김)
          const innerRemove = ['#errors', '#warnings', '.error-list', '.warning-list', 'dl', 'table'];
          innerRemove.forEach(sel => {
            try { results.querySelectorAll(sel).forEach(el => el.remove()); } catch (_) {}
          });
        }
      });

      const contentHeight = await page.evaluate(() => document.body.scrollHeight);
      await page.setViewportSize({ width: 1280, height: Math.min(contentHeight, 1200) });
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
