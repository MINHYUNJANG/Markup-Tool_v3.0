import { chromium, firefox, webkit } from 'playwright';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CONFIGS = {
  chrome: {
    engine: 'chromium',
    viewport: { width: 1920, height: 1080 },
  },
  edge: {
    engine: 'chromium',
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  },
  whale: {
    engine: 'chromium',
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Whale/3.26.224.18 Safari/537.36',
  },
  firefox: {
    engine: 'firefox',
    viewport: { width: 1920, height: 1080 },
  },
  safari: {
    engine: 'chromium',
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  },
  ios: {
    engine: 'chromium',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  android: {
    engine: 'chromium',
    viewport: { width: 412, height: 915 },
    isMobile: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },
};

const ENGINES = { chromium, firefox, webkit };

export async function POST(request) {
  let browser;
  try {
    const { url, browser: browserId } = await request.json();

    if (!url || !browserId) {
      return Response.json({ detail: 'url과 browser는 필수입니다.' }, { status: 400 });
    }

    const config = CONFIGS[browserId];
    if (!config) {
      return Response.json({ detail: `지원하지 않는 브라우저: ${browserId}` }, { status: 400 });
    }

    const engineType = ENGINES[config.engine];
    browser = await engineType.launch({ headless: true });

    const contextOptions = { viewport: config.viewport };
    if (config.userAgent) contextOptions.userAgent = config.userAgent;
    if (config.isMobile) contextOptions.isMobile = true;

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // domcontentloaded 후 추가 대기 (load/networkidle은 광고·분석 스크립트로 타임아웃 발생)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    // 전체 페이지 높이로 뷰포트 확장 후 캡쳐
    const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: config.viewport.width, height: fullHeight });
    await page.waitForTimeout(300);

    const imageBuffer = await page.screenshot({ type: 'png', fullPage: false });
    const base64 = imageBuffer.toString('base64');

    return Response.json({ image: base64 });
  } catch (e) {
    return Response.json({ detail: e.message }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
