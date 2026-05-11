import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function extractPageTitle(html) {
  // 1순위: 페이지 제목용 클래스명을 가진 heading 요소
  const headingClassPatterns = [
    /class="[^"]*(?:pageTitle|page[-_]title|pagetitle|sub[-_]?tit(?:le)?|cont[-_]?tit(?:le)?|tit[-_]?page|tit[-_]?sub|section[-_]?tit(?:le)?|inner[-_]?tit(?:le)?)[^"]*"[^>]*>([^<]+)</i,
  ];
  for (const pat of headingClassPatterns) {
    const m = html.match(pat);
    if (m) {
      const t = m[1].trim();
      if (t) return t;
    }
  }

  // 2순위: <h1> ~ <h3> 첫 번째 텍스트 (스크립트·스타일 제거 후)
  const bodyOnly = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                       .replace(/<style[\s\S]*?<\/style>/gi, '');
  const hm = bodyOnly.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);
  if (hm) {
    const t = hm[1].trim();
    if (t) return t;
  }

  // 3순위: <title> 앞부분
  const tm = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (tm) {
    const full = tm[1].trim();
    const short = full.split(/\s*\|\s*|\s+[-–—]\s+|\s*::\s*|\s*>\s+/)[0].trim();
    return short || full;
  }

  return '';
}

async function fetchTitle(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarkupTool/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();
    return extractPageTitle(html);
  } catch {
    return '';
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const items = body.items ?? [];

    if (!items.length) {
      return Response.json({ detail: '항목이 없습니다.' }, { status: 400 });
    }

    const uniqueUrls = [...new Set(items.map(it => it.url))];
    const titleMap = {};
    await Promise.all(
      uniqueUrls.map(async url => {
        titleMap[url] = await fetchTitle(url);
      })
    );

    const enrichedItems = items.map(it => ({
      ...it,
      title: titleMap[it.url] || it.url,
    }));

    const templatePath = path.join(process.cwd(), 'template.hwpx');
    const scriptPath = path.join(process.cwd(), 'lib', 'generate_hwpx.py');

    const hwpxBytes = await new Promise((resolve, reject) => {
      const proc = spawn('python3', [scriptPath, templatePath]);
      const chunks = [];
      const errChunks = [];

      proc.stdout.on('data', chunk => chunks.push(chunk));
      proc.stderr.on('data', chunk => errChunks.push(chunk));

      proc.stdin.write(JSON.stringify({ items: enrichedItems }));
      proc.stdin.end();

      proc.on('close', code => {
        if (code !== 0) {
          reject(new Error(Buffer.concat(errChunks).toString() || 'Python 오류'));
        } else {
          resolve(Buffer.concat(chunks));
        }
      });

      proc.on('error', reject);
    });

    return new Response(hwpxBytes, {
      headers: {
        'Content-Type': 'application/vnd.hancom.hwpx',
        'Content-Disposition': 'attachment; filename="webstandard_inspection.hwpx"',
        'Content-Length': String(hwpxBytes.length),
      },
    });
  } catch (e) {
    return Response.json({ detail: e.message }, { status: 500 });
  }
}
