#!/usr/bin/env python3
"""
HWPX 생성 스크립트
stdin에서 JSON 데이터를 읽고, stdout으로 HWPX 바이너리를 출력합니다.

JSON 스키마:
{
  "items": [
    {
      "url": "https://...",
      "browser": "chrome",
      "title": "페이지 제목",
      "w3c_error_count": 0,
      "w3c_warning_count": 0,
      "validator_screenshot": "base64...",  // W3C 증거 스크린샷
      "screenshot": "base64..."             // 브라우저 스크린샷
    }
  ]
}
"""
import sys
import re
import io
import json
import base64
import struct
import zipfile

BROWSER_LABELS = {
    "chrome": "Chrome",
    "edge": "Edge",
    "whale": "Whale",
    "firefox": "Firefox",
    "safari": "Safari",
    "ios": "iOS",
    "android": "Android",
}


def xml_escape(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def png_size(data):
    """PNG 바이너리에서 (width, height) 픽셀 읽기"""
    if len(data) < 24:
        return None, None
    w, h = struct.unpack('>II', data[16:24])
    return w, h


def fit_image(img_w, img_h, max_w, max_h):
    """이미지를 max 범위 안에 비율 유지하며 맞춤 (HWP 단위 반환)"""
    if img_w <= 0 or img_h <= 0:
        return max_w, max_h
    scale = min(max_w / img_w, max_h / img_h)
    return int(img_w * scale), int(img_h * scale)


def make_text_run(char_pr_id, text):
    return f'<hp:run charPrIDRef="{char_pr_id}"><hp:t>{xml_escape(text)}</hp:t></hp:run>'


def make_pic_run(char_pr_id, bin_id_str, pic_w, pic_h, pic_id=1):
    """bin_id_str: 'image1', 'image2' 형태의 문자열 ID"""
    cx = pic_w // 2
    cy = pic_h // 2
    return (
        f'<hp:run charPrIDRef="{char_pr_id}">'
        f'<hp:pic id="{pic_id}" zOrder="0" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" '
        f'textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" '
        f'instid="{pic_id}" reverse="0">'
        f'<hp:offset x="0" y="0"/>'
        f'<hp:orgSz width="{pic_w}" height="{pic_h}"/>'
        f'<hp:curSz width="0" height="0"/>'
        f'<hp:flip horizontal="0" vertical="0"/>'
        f'<hp:rotationInfo angle="0" centerX="{cx}" centerY="{cy}" rotateimage="1"/>'
        f'<hp:renderingInfo>'
        f'<hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>'
        f'<hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>'
        f'<hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>'
        f'</hp:renderingInfo>'
        f'<hc:img binaryItemIDRef="{bin_id_str}" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/>'
        f'<hp:imgRect>'
        f'<hc:pt0 x="0" y="0"/>'
        f'<hc:pt1 x="{pic_w}" y="0"/>'
        f'<hc:pt2 x="{pic_w}" y="{pic_h}"/>'
        f'<hc:pt3 x="0" y="{pic_h}"/>'
        f'</hp:imgRect>'
        f'<hp:imgClip left="0" right="{pic_w}" top="0" bottom="{pic_h}"/>'
        f'<hp:inMargin left="0" right="0" top="0" bottom="0"/>'
        f'<hp:imgDim dimwidth="{pic_w}" dimheight="{pic_h}"/>'
        f'<hp:effects/>'
        f'<hp:sz width="{pic_w}" widthRelTo="ABSOLUTE" height="{pic_h}" heightRelTo="ABSOLUTE" protect="0"/>'
        f'<hp:pos treatAsChar="0" affectLSpacing="0" flowWithText="1" allowOverlap="0" '
        f'holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" '
        f'horzAlign="CENTER" vertOffset="0" horzOffset="0"/>'
        f'<hp:outMargin left="0" right="0" top="0" bottom="0"/>'
        f'<hp:shapeComment>그림</hp:shapeComment>'
        f'</hp:pic>'
        f'<hp:t/>'
        f'</hp:run>'
    )


def cell_inner_w(cell_w, left=510, right=510):
    return cell_w - left - right


def cell_inner_h(cell_h, top=141, bottom=141):
    return cell_h - top - bottom


def replace_cell_content(tbl_xml, col_addr, row_addr, new_run, line_wrap=None):
    """셀의 빈 self-closing run을 새 run으로 교체"""
    marker = f'<hp:cellAddr colAddr="{col_addr}" rowAddr="{row_addr}"/>'
    pos = tbl_xml.find(marker)
    if pos == -1:
        return tbl_xml

    tc_start = tbl_xml.rfind('<hp:tc ', 0, pos)
    tc_end = tbl_xml.find('</hp:tc>', pos) + len('</hp:tc>')
    cell = tbl_xml[tc_start:tc_end]

    run_m = re.search(r'<hp:run charPrIDRef="\d+"/>', cell)
    if run_m:
        cell = cell[:run_m.start()] + new_run + cell[run_m.end():]

    if line_wrap:
        cell = re.sub(r'lineWrap="[^"]*"', f'lineWrap="{line_wrap}"', cell)

    return tbl_xml[:tc_start] + cell + tbl_xml[tc_end:]


def fill_list_table(tbl_xml, items, start_num=1, col_offsets=(0, 1, 2)):
    """점검 대상 목록 테이블(3열) 채우기"""
    rows = re.findall(r'<hp:tr\b[^>]*>.*?</hp:tr>', tbl_xml, re.DOTALL)
    max_data_rows = len(rows) - 1  # 헤더 제외

    for i, item in enumerate(items[:max_data_rows]):
        row_idx = i + 1
        c0, c1, c2 = col_offsets
        tbl_xml = replace_cell_content(
            tbl_xml, c0, row_idx,
            make_text_run("3", str(start_num + i))
        )
        tbl_xml = replace_cell_content(
            tbl_xml, c1, row_idx,
            make_text_run("3", item.get("title", ""))
        )
        tbl_xml = replace_cell_content(
            tbl_xml, c2, row_idx,
            make_text_run("3", item.get("url", "")),
            line_wrap="ANY"
        )
    return tbl_xml, min(len(items), max_data_rows)


def remove_unused_rows(tbl_xml, keep_from_row2):
    """Table 4의 미사용 브라우저 행 제거. keep_from_row2: row 2부터 유지할 행 수"""
    rows = list(re.finditer(r'<hp:tr\b[^>]*>.*?</hp:tr>', tbl_xml, re.DOTALL))
    total_rows = len(rows)
    # row 0: 헤더, row 1: 데이터, row 2~: 브라우저 행
    rows_to_keep = 2 + keep_from_row2

    if rows_to_keep >= total_rows:
        return tbl_xml

    # 뒤에서부터 삭제
    result = tbl_xml
    for i in range(total_rows - 1, rows_to_keep - 1, -1):
        m = rows[i]
        result = result[:m.start()] + result[m.end():]

    result = re.sub(r'rowCnt="\d+"', f'rowCnt="{rows_to_keep}"', result, count=1)
    return result


def generate_hwpx(template_path, data):
    items = data.get("items", [])
    if not items:
        raise ValueError("items가 비어 있습니다.")

    with zipfile.ZipFile(template_path, "r") as zin:
        all_files = {name: zin.read(name) for name in zin.namelist()}
        orig_info = {info.filename: info.compress_type for info in zin.infolist()}
        orig_order = [info.filename for info in zin.infolist()]

    section_xml = all_files["Contents/section0.xml"].decode("utf-8")
    content_hpf = all_files["Contents/content.hpf"].decode("utf-8")

    # 테이블 추출 (4개)
    table_matches = list(re.finditer(
        r'<hp:tbl\b[^>]*>.*?</hp:tbl>', section_xml, re.DOTALL
    ))
    table_xmls = [m.group() for m in table_matches]

    # 바이너리 이미지 목록 (id는 "image1", "image2" 형태)
    bin_items = []
    bin_counter = [1]

    def add_bin(png_b64):
        if not png_b64:
            return None
        bid_num = bin_counter[0]
        bin_counter[0] += 1
        bid_str = f"image{bid_num}"
        fname = f"image{bid_num}.png"
        raw = base64.b64decode(png_b64)
        img_w, img_h = png_size(raw)
        bin_items.append({
            "id_str": bid_str,
            "filename": fname,
            "data": raw,
        })
        return bid_str, bid_num, img_w, img_h

    # === Table 1 & 2: 점검 대상 목록 ===
    unique_urls_seen = {}
    unique_items = []
    for it in items:
        url = it.get("url", "")
        if url not in unique_urls_seen:
            unique_urls_seen[url] = it
            unique_items.append(it)

    tbl1, filled1 = fill_list_table(table_xmls[0], unique_items, start_num=1)
    remaining = unique_items[filled1:]
    tbl2, _ = fill_list_table(table_xmls[1], remaining, start_num=filled1 + 1)
    table_xmls[0] = tbl1
    table_xmls[1] = tbl2

    ROW_SIZES = [
        (12486, 24000, 35409, 24000),  # Row 2
        (12486, 24000, 35409, 24000),  # Row 3
        (12486, 24000, 35409, 24000),  # Row 4
        (12486, 24000, 35409, 24000),  # Row 5
        (12486, 24000, 35409, 24000),  # Row 6
    ]

    # 테이블 3·4 원본 템플릿 보존 (URL 2+에서 재사용)
    tbl3_orig = table_xmls[2]
    tbl4_orig = table_xmls[3]

    # 테이블 3·4의 <hp:p> 래퍼와 구분 단락 추출 (원본 section_xml 기준)
    m3_orig = table_matches[2]
    m4_orig = table_matches[3]
    tbl3_p_start = section_xml.rfind('<hp:p ', 0, m3_orig.start())
    tbl3_p_end   = section_xml.find('</hp:p>', m3_orig.end()) + len('</hp:p>')
    tbl4_p_start = section_xml.rfind('<hp:p ', 0, m4_orig.start())
    tbl4_p_end   = section_xml.find('</hp:p>', m4_orig.end()) + len('</hp:p>')

    tbl3_pre  = section_xml[tbl3_p_start:m3_orig.start()]   # <hp:p...> ~ <hp:tbl 직전
    tbl3_post = section_xml[m3_orig.end():tbl3_p_end]        # </hp:tbl> ~ </hp:p>
    tbl4_pre  = section_xml[tbl4_p_start:m4_orig.start()]
    tbl4_post = section_xml[m4_orig.end():tbl4_p_end]
    sep_34    = section_xml[tbl3_p_end:tbl4_p_start]         # "웹 호환성 점검 결과" 단락

    def fill_tbl3(tbl, item, num):
        err_cnt  = item.get("w3c_error_count", 0)
        warn_cnt = item.get("w3c_warning_count", 0)
        res = "적정" if (err_cnt == 0 and warn_cnt == 0) else "미적정"
        tbl = replace_cell_content(tbl, 0, 1, make_text_run("12", str(num)))
        tbl = replace_cell_content(tbl, 1, 1, make_text_run("12", item.get("title", "")))
        tbl = replace_cell_content(tbl, 2, 1, make_text_run("12", item.get("url", "")), line_wrap="ANY")
        tbl = replace_cell_content(tbl, 3, 1, make_text_run("12", res))
        val_ss = item.get("validator_screenshot")
        if val_ss:
            r = add_bin(val_ss)
            if r:
                bid_str, bid_num, iw, ih = r
                pw, ph = fit_image(iw, ih, cell_inner_w(47895), cell_inner_h(26912))
                tbl = replace_cell_content(tbl, 0, 2, make_pic_run("3", bid_str, pw, ph, bid_num))
        # Row 2: Nu Html Checker 캡쳐 (없으면 빈 셀), Row 3: 항상 빈 셀
        return tbl

    def fill_tbl4(tbl, item, num, browser_its):
        tbl = replace_cell_content(tbl, 0, 1, make_text_run("12", str(num)))
        tbl = replace_cell_content(tbl, 1, 1, make_text_run("12", item.get("title", "")))
        tbl = replace_cell_content(tbl, 2, 1, make_text_run("12", item.get("url", "")), line_wrap="ANY")
        tbl = replace_cell_content(tbl, 3, 1, make_text_run("12", "적정"))
        for i, bit in enumerate(browser_its[:5]):
            row_addr = i + 2
            lw, lh, rw, rh = ROW_SIZES[i]
            label = BROWSER_LABELS.get(bit.get("browser", ""), bit.get("browser", ""))
            tbl = replace_cell_content(tbl, 0, row_addr, make_text_run("3", label))
            ss = bit.get("screenshot")
            if ss:
                r = add_bin(ss)
                if r:
                    bid_str, bid_num, iw, ih = r
                    pw, ph = fit_image(iw, ih, cell_inner_w(rw), cell_inner_h(rh))
                    tbl = replace_cell_content(tbl, 2, row_addr, make_pic_run("3", bid_str, pw, ph, bid_num))
        tbl = remove_unused_rows(tbl, min(len(browser_its), 5))
        return tbl

    # === Table 3·4: URL 1 ===
    first = unique_items[0] if unique_items else {}
    first_url = first.get("url", "")
    browser_items_1 = [it for it in items if it.get("url") == first_url]

    table_xmls[2] = fill_tbl3(tbl3_orig, first, 1)
    table_xmls[3] = fill_tbl4(tbl4_orig, first, 1, browser_items_1)

    # === section0.xml 재구성 ===
    result_xml = section_xml
    for i in range(len(table_matches) - 1, -1, -1):
        m = table_matches[i]
        result_xml = result_xml[:m.start()] + table_xmls[i] + result_xml[m.end():]

    # === URL 2+: 나(T3) 전체 먼저, 다(T4) 전체 나중에 ===
    if len(unique_items) > 1:
        t3_extra = ""
        t4_extra = ""
        for idx, item in enumerate(unique_items[1:], start=2):
            item_url = item.get("url", "")
            browser_its = [it for it in items if it.get("url") == item_url]

            tbl3_n = fill_tbl3(tbl3_orig, item, idx)
            tbl4_n = fill_tbl4(tbl4_orig, item, idx, browser_its)

            pre3 = re.sub(r'pageBreak="\d+"', 'pageBreak="0"', tbl3_pre, count=1)
            pre3 = re.sub(r' id="\d+"', ' id="0"', pre3, count=1)
            pre4 = re.sub(r' id="\d+"', ' id="0"', tbl4_pre, count=1)

            t3_extra += pre3 + tbl3_n + tbl3_post
            t4_extra += pre4 + tbl4_n + tbl4_post

        # T3 extras: T3(1) 뒤에 삽입
        tbl_ends = [m.end() for m in re.finditer(r'</hp:tbl>', result_xml)]
        if len(tbl_ends) >= 3:
            insert_t3 = result_xml.find('</hp:p>', tbl_ends[2]) + len('</hp:p>')
            result_xml = result_xml[:insert_t3] + t3_extra + result_xml[insert_t3:]

        # T4 extras: T4(1) 뒤에 삽입 (T3 삽입 후 재탐색)
        tbl_ends = [m.end() for m in re.finditer(r'</hp:tbl>', result_xml)]
        t4_idx = 2 + len(unique_items)  # T1=0, T2=1, T3들, T4(1)
        if len(tbl_ends) > t4_idx:
            insert_t4 = result_xml.find('</hp:p>', tbl_ends[t4_idx]) + len('</hp:p>')
            result_xml = result_xml[:insert_t4] + t4_extra + result_xml[insert_t4:]

    # === content.hpf: BinData 항목을 manifest에 등록 ===
    if bin_items:
        manifest_items = "".join(
            f'<opf:item id="{b["id_str"]}" href="BinData/{b["filename"]}" '
            f'media-type="image/png" isEmbeded="1"/>'
            for b in bin_items
        )
        content_hpf = content_hpf.replace("</opf:manifest>", manifest_items + "</opf:manifest>")

    # === 새 HWPX 파일 생성 ===
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w") as zout:
        for name in orig_order:
            compress = orig_info.get(name, zipfile.ZIP_DEFLATED)
            if name == "Contents/section0.xml":
                zout.writestr(zipfile.ZipInfo(name), result_xml.encode("utf-8"), compress)
            elif name == "Contents/content.hpf":
                zout.writestr(zipfile.ZipInfo(name), content_hpf.encode("utf-8"), compress)
            else:
                zout.writestr(zipfile.ZipInfo(name), all_files[name], compress)

        for b in bin_items:
            zout.writestr(
                zipfile.ZipInfo(f'BinData/{b["filename"]}'),
                b["data"],
                zipfile.ZIP_STORED,
            )

    return output.getvalue()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: generate_hwpx.py <template.hwpx>\n")
        sys.exit(1)

    template_path = sys.argv[1]
    data = json.loads(sys.stdin.read())

    try:
        result = generate_hwpx(template_path, data)
        sys.stdout.buffer.write(result)
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)
