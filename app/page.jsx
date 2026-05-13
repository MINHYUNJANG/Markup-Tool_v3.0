'use client'
import { useState, useEffect, useRef } from 'react'
import './App.css'
import { getRemediation } from '../lib/w3c-remediation.js'

const API_BASE = '/api'
const DEV_MOCK = false

const MOCK_CRAWL = {
  success: true,
  text: '개인정보 처리방침\n\n제1조 (개인정보의 처리 목적)\n회사는 다음의 목적을 위하여 개인정보를 처리합니다.\n\n① 서비스 제공\n② 회원 관리\n③ 마케팅 활용\n\n제2조 (개인정보의 처리 및 보유 기간)\n이용자의 개인정보는 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.',
  html: '<h1>개인정보 처리방침</h1><h2>제1조 (개인정보의 처리 목적)</h2><p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p><ol><li>서비스 제공</li><li>회원 관리</li><li>마케팅 활용</li></ol><h2>제2조 (개인정보의 처리 및 보유 기간)</h2><p>이용자의 개인정보는 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>',
  images: [],
}

const MOCK_FIGMA_INNERS = {
  greeting: {
    tyA: `\t<div class="lead-wrap">
\t\t<div class="inner">
\t\t\t<p>더 <strong>강한 학교</strong>로 <br>더 <strong>빛나는 미래</strong>를 향해</p>
\t\t\t<div class="bg-text">
\t\t\t\t<div class="track">
\t\t\t\t\t<p>Academic Space Academic Space</p>
\t\t\t\t\t<p>Academic Space Academic Space</p>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>
\t<div class="txt-wrap">
\t\t<div class="txt">
\t\t\t<p>우리 학교는 배움 속에서 성장하고, 나눔 속에서 행복을 느끼는 학교라는 교육 비전을 가지고 있습니다.<br>학교는 단순히 지식을 전달하는 공간이 아니라, 아이들이 자신의 꿈을 발견하고 서로 존중하며 협력하는 법을 배우는 삶의 터전이라고 생각합니다.</p>
\t\t\t<p>학생들은 이곳에서 기초 학력과 창의적 역량을 키우고, 더불어 살아가는 사회 속에서 필요한 배려와 공동체 정신을 익히며 자라나게 될 것입니다.</p>
\t\t\t<p>이를 위해 우리 교직원 모두는 학생 한 명 한 명의 눈높이에 맞춘 교육을 실천하고,<br>미래 사회를 살아갈 힘을 기를 수 있도록 다양한 교육 활동을 펼쳐 나가겠습니다.</p>
\t\t\t<p>감사합니다.</p>
\t\t</div>
\t\t<div class="sign">○○학교 교장 <strong>홍 길 동</strong></div>
\t</div>`,
    tyB: `\t<div class="container">
\t\t<!-- 이미지 있을 시 -->
\t\t<!-- <div class="img-wrap">
\t\t\t<div class="img">
\t\t\t\t<p><img src="/common/images/sub_com/greeting_B_temp.png" alt="교장 홍길동 사진"></p>
\t\t\t</div>
\t\t\t<div class="sign">○○학교 교장 <strong>홍 길 동</strong></div>
\t\t</div> -->
\t\t<div class="inner">
\t\t\t<div class="lead-wrap">
\t\t\t\t<div class="lead-txt">
\t\t\t\t\t<h4>Great School!</h4>
\t\t\t\t\t<p>더 강한 학교로 더 빛나는 미래를 향해</p>
\t\t\t\t</div>
\t\t\t\t<div class="sign">○○학교 교장 <strong>홍 길 동</strong></div>
\t\t\t</div>
\t\t\t<div class="txt-wrap">
\t\t\t\t<div class="txt">
\t\t\t\t\t<p>우리 학교는 배움 속에서 성장하고, 나눔 속에서 행복을 느끼는 학교라는 교육 비전을 가지고 있습니다.<br>학교는 단순히 지식을 전달하는 공간이 아니라, 아이들이 자신의 꿈을 발견하고 서로 존중하며 협력하는 법을 배우는 삶의 터전이라고 생각합니다.</p>
\t\t\t\t\t<p>학생들은 이곳에서 기초 학력과 창의적 역량을 키우고, 더불어 살아가는 사회 속에서 필요한 배려와 공동체 정신을 익히며 자라나게 될 것입니다.</p>
\t\t\t\t\t<p>이를 위해 우리 교직원 모두는 학생 한 명 한 명의 눈높이에 맞춘 교육을 실천하고,<br>미래 사회를 살아갈 힘을 기를 수 있도록 다양한 교육 활동을 펼쳐 나가겠습니다.</p>
\t\t\t\t\t<p>감사합니다.</p>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>`,
    tyC: `\t<div class="container">
\t\t<div class="obj">
\t\t\t<p class="mask mask1"></p>
\t\t\t<p class="mask mask2"></p>
\t\t\t<p class="mask mask3"></p>
\t\t</div>
\t\t<div class="inner">
\t\t\t<div class="lead-wrap">
\t\t\t\t<div class="lead-txt">
\t\t\t\t\t<h4>안녕하십니까 ? <br><strong>○○학교 교장 홍길동</strong>입니다.</h4>
\t\t\t\t\t<p>우리 학교에 오신 것을 환영합니다.</p>
\t\t\t\t</div>
\t\t\t\t<!-- 이미지 있을 시 -->
\t\t\t\t<div class="img"><p><img src="/common/images/sub_com/greeting_C_temp.png" alt="교장 홍길동 사진"></p></div>
\t\t\t</div>
\t\t\t<div class="txt-wrap">
\t\t\t\t<div class="txt">
\t\t\t\t\t<p>우리 학교 홈페이지에 방문해 주셔서 정말 고맙습니다.<br>이곳에서 우리 아이들의 밝은 웃음소리와 열정적인 배움의 모습을 느끼실 수 있기를 바랍니다.</p>
\t\t\t\t\t<p>○○학교는 단순히 지식을 전달하는 곳이 아닙니다.<br>아이들이 꿈을 키우고, 친구들과 함께 성장하며, 세상을 바라보는 넓은 시각을 기를 수 있는 따뜻한 보금자리입니다.</p>
\t\t\t\t\t<h4 class="tit-st contents">우리가 추구하는 자세</h4>
\t\t\t\t\t<ul class="bu-st1 list">
\t\t\t\t\t\t<li>아이들의 개성과 재능을 발견하고 키워주는 교육</li>
\t\t\t\t\t\t<li>서로를 존중하고 배려하는 마음을 기르는 교육</li>
\t\t\t\t\t\t<li>세계와 소통하며 미래를 준비하는 교육</li>
\t\t\t\t\t\t<li>건강한 몸과 마음으로 행복한 삶을 살아가는 교육</li>
\t\t\t\t\t</ul>
\t\t\t\t\t<p>매일매일 아이들과 함께 웃고, 함께 배우며, 함께 꿈을 그려가는 우리 선생님들과 함께 여러분의 소중한 자녀가 건강하고 행복하게 성장할 수 있도록 최선을 다하겠습니다.</p>
\t\t\t\t\t<p>감사합니다.</p>
\t\t\t\t</div>
\t\t\t\t<div class="sign">○○학교 교장 <strong>홍 길 동</strong></div>
\t\t\t</div>
\t\t</div>
\t</div>`,
    _default: `\t<div class="lead-wrap">
\t\t<div class="inner">
\t\t\t<p>우리 ○○초등학교를 찾아주신 여러분을 <strong>진심으로 환영합니다.</strong></p>
\t\t\t<div class="bg-text">
\t\t\t\t<div class="track">
\t\t\t\t\t<p>○○초등학교</p>
\t\t\t\t\t<p>○○초등학교</p>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>
\t<div class="txt-wrap">
\t\t<div class="txt">
\t\t\t<p>우리 학교는 정직하고 창의적인 어린이를 키우기 위해 최선을 다하고 있습니다.</p>
\t\t\t<p>학생 한 명 한 명의 꿈과 가능성을 소중히 여기며, 행복한 배움터를 만들어 가겠습니다.</p>
\t\t</div>
\t\t<div class="sign">○○초등학교 교장 <strong>홍 길 동</strong></div>
\t</div>`,
  },
  history: {
    tyB: `\t<div class="container">
\t\t<!-- 이미지 있을 시 -->
\t\t<!-- <div class="obj"><img src="/common/images/sub_com/history_B_bg.png" alt=""></div> -->
\t\t<div class="inner">
\t\t\t<div class="history-sticky">
\t\t\t\t<div class="history-header">
\t\t\t\t\t<h4>학생을 위한 좋은 학교<br> <strong>○○학교</strong></h4>
\t\t\t\t\t<strong class="year-title">2020 ~ 현재</strong>
\t\t\t\t\t<div class="year">
\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t<li><a href="javascript:void(0);" data-target="history1">2020 ~ 현재</a></li>
\t\t\t\t\t\t\t<li><a href="javascript:void(0);" data-target="history2">2010 ~ 2019</a></li>
\t\t\t\t\t\t\t<li><a href="javascript:void(0);" data-target="history3">2000 ~ 2009</a></li>
\t\t\t\t\t\t\t<li><a href="javascript:void(0);" data-target="history4">1990 ~ 1999</a></li>
\t\t\t\t\t\t\t<li><a href="javascript:void(0);" data-target="history5">이전 ~ 1989</a></li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t\t<div class="list-wrap">
\t\t\t\t<p class="progress"><span></span></p>
\t\t\t\t<div class="list" id="history1">
\t\t\t\t\t<dl>
\t\t\t\t\t\t<dt>2025</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<ul class="bu-st3 list">
\t\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t\t<dl>
\t\t\t\t\t\t<dt>2024</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<ul class="bu-st3 list">
\t\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t</div>
\t\t\t\t<div class="list" id="history2">
\t\t\t\t\t<dl>
\t\t\t\t\t\t<dt>2012</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<ul class="bu-st3 list">
\t\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t</div>
\t\t\t\t<div class="list" id="history3">
\t\t\t\t\t<dl>
\t\t\t\t\t\t<dt>2002</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<ul class="bu-st3 list">
\t\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t</div>
\t\t\t\t<div class="list" id="history4">
\t\t\t\t\t<dl>
\t\t\t\t\t\t<dt>1999</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<ul class="bu-st3 list">
\t\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t</div>
\t\t\t\t<div class="list" id="history5">
\t\t\t\t\t<dl>
\t\t\t\t\t\t<dt>1989 - 이전</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<ul class="bu-st3 list">
\t\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>`,
    tyC: `\t<div class="container">
\t\t<div class="history-sticky">
\t\t\t<div class="history-header">
\t\t\t\t<h4><span>History</span></h4>
\t\t\t\t<div class="year">
\t\t\t\t\t<div class="tab-st cntnts">
\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t<li class="on"><a href="" data-target="history1">현재</a></li>
\t\t\t\t\t\t\t<li><a href="" data-target="history2">2010년대</a></li>
\t\t\t\t\t\t\t<li><a href="" data-target="history3">2000년대</a></li>
\t\t\t\t\t\t\t<li><a href="" data-target="history4">2000년대 이전</a></li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t\t<div class="list-wrap">
\t\t\t<div class="list" id="history1">
\t\t\t\t<dl>
\t\t\t\t\t<dt>2025</dt>
\t\t\t\t\t<dd>
\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t<li><strong>08.20 - 09.10</strong>
\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</dd>
\t\t\t\t</dl>
\t\t\t\t<dl>
\t\t\t\t\t<dt>2024</dt>
\t\t\t\t\t<dd>
\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</dd>
\t\t\t\t</dl>
\t\t\t</div>
\t\t\t<div class="list" id="history2">
\t\t\t\t<dl>
\t\t\t\t\t<dt>2012</dt>
\t\t\t\t\t<dd>
\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</dd>
\t\t\t\t</dl>
\t\t\t</div>
\t\t\t<div class="list" id="history3">
\t\t\t\t<dl>
\t\t\t\t\t<dt>2002</dt>
\t\t\t\t\t<dd>
\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</dd>
\t\t\t\t</dl>
\t\t\t</div>
\t\t\t<div class="list" id="history4">
\t\t\t\t<dl>
\t\t\t\t\t<dt>1999</dt>
\t\t\t\t\t<dd>
\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t<li><strong>08.20</strong>
\t\t\t\t\t\t\t\t<div class="inr"><p>학교 연혁 내용이 들어갑니다 학교 연혁 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</dd>
\t\t\t\t</dl>
\t\t\t</div>
\t\t</div>
\t</div>`,
    tyA: `\t<div class="history-sticky">
\t\t<div class="history-header">
\t\t\t<p class="txt a-l"><strong>함께</strong> 걸어온 <strong>발걸음</strong>,</p>
\t\t\t<div class="year">
\t\t\t\t<span>2026</span>
\t\t\t</div>
\t\t\t<p class="txt a-r">오늘의 <strong>학교</strong>를 <strong>이루다</strong></p>
\t\t</div>
\t\t<div class="list swiper historySwiper">
\t\t\t<div class="swiper-wrapper">
\t\t\t\t<div class="swiper-slide" data-year="2026">
\t\t\t\t\t<strong>02.07 - 02.08</strong>
\t\t\t\t\t<p>연혁 내용이 들어갑니다. 연혁 내용이 들어갑니다.</p>
\t\t\t\t\t<strong>02.07 - 02.08</strong>
\t\t\t\t\t<p>연혁 내용이 들어갑니다.</p>
\t\t\t\t</div>
\t\t\t\t<div class="swiper-slide" data-year="2025">
\t\t\t\t\t<strong>02.07 - 02.08</strong>
\t\t\t\t\t<p>연혁 내용이 들어갑니다.</p>
\t\t\t\t</div>
\t\t\t\t<div class="swiper-slide" data-year="2024">
\t\t\t\t\t<strong>02.07 - 02.08</strong>
\t\t\t\t\t<p>연혁 내용이 들어갑니다.</p>
\t\t\t\t</div>
\t\t\t\t<div class="swiper-slide" data-year="2023">
\t\t\t\t\t<strong>02.07 - 02.08</strong>
\t\t\t\t\t<p>연혁 내용이 들어갑니다.</p>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t\t<div class="timeline">
\t\t\t<div class="swiper timelineSwiper">
\t\t\t\t<div class="swiper-wrapper">
\t\t\t\t\t<div class="swiper-slide" tabindex="0">2026</div>
\t\t\t\t\t<div class="swiper-slide" tabindex="0">2025</div>
\t\t\t\t\t<div class="swiper-slide" tabindex="0">2024</div>
\t\t\t\t\t<div class="swiper-slide" tabindex="0">2023</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>`,
  },
  'pri-his': {
    tyB: `\t<div class="list-wrap container">
\t\t<ul>
\t\t\t<li>
\t\t\t\t<button class="btn-item" role="region" aria-expanded="false" aria-controls="detail-panel">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_B_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span>제 01대 교장</span>
\t\t\t\t\t\t<strong>홍길동</strong>
\t\t\t\t\t\t<p>2023.03.01. ~ 현재</p>
\t\t\t\t\t</div>
\t\t\t\t</button>
\t\t\t\t<div class="detail-data">
\t\t\t\t\t<dl class="pri">
\t\t\t\t\t\t<dt>홍길동</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<strong>제 01대 교장</strong>
\t\t\t\t\t\t\t<p>2023.03.01 ~ 현재</p>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t\t<dl class="his">
\t\t\t\t\t\t<dt>학력</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t\t<li><strong>1982</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>00대학교 00학과 졸업</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t<li><strong>1985</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>00대학교 00학과 졸업</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t\t<dl class="his">
\t\t\t\t\t\t<dt>주요 업적</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t\t<li><strong>1982</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>00대학교 00학과 졸업</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t<li><strong>1985 ~ 2000</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>주요 업적 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t</div>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<button class="btn-item" role="region" aria-expanded="false" aria-controls="detail-panel">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_B_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span>제 02대 교장</span>
\t\t\t\t\t\t<strong>홍길동</strong>
\t\t\t\t\t\t<p>2020.03.01. ~ 2023.02.28.</p>
\t\t\t\t\t</div>
\t\t\t\t</button>
\t\t\t\t<div class="detail-data">
\t\t\t\t\t<dl class="pri">
\t\t\t\t\t\t<dt>홍길동</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<strong>제 02대 교장</strong>
\t\t\t\t\t\t\t<p>2020.03.01 ~ 2023.02.28</p>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t\t<dl class="his">
\t\t\t\t\t\t<dt>학력</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t\t<li><strong>1980</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>00대학교 00학과 졸업</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t\t<dl class="his">
\t\t\t\t\t\t<dt>주요 업적</dt>
\t\t\t\t\t\t<dd>
\t\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t\t<li><strong>1985 ~ 2000</strong>
\t\t\t\t\t\t\t\t\t<div class="inr"><p>주요 업적 내용이 들어갑니다</p></div>
\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</dd>
\t\t\t\t\t</dl>
\t\t\t\t</div>
\t\t\t</li>
\t\t</ul>
\t</div>`,
    tyC: `\t<div class="list-wrap">
\t\t<ul>
\t\t\t<li>
\t\t\t\t<div class="info-wrap">
\t\t\t\t\t<!-- 이미지 있을 시 -->
\t\t\t\t\t<!-- <p class="img"><img src="/common/images/sub_com/pri_history_C_temp.png" alt=""></p> -->
\t\t\t\t\t<div class="inr">
\t\t\t\t\t\t<span class="order">제 <strong>01</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2023.03.01. ~ 현재
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<!-- 이미지 있을 시 -->
\t\t\t\t<!-- <div class="his-wrap">
\t\t\t\t\t<h5>주요업적</h5>
\t\t\t\t\t<p class="bu-st3">업적 내용</p>
\t\t\t\t</div> -->
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="info-wrap">
\t\t\t\t\t<div class="inr">
\t\t\t\t\t\t<span class="order">제 <strong>02</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2020.03.01. ~ 2023.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="info-wrap">
\t\t\t\t\t<div class="inr">
\t\t\t\t\t\t<span class="order">제 <strong>03</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2017.03.01. ~ 2020.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="info-wrap">
\t\t\t\t\t<div class="inr">
\t\t\t\t\t\t<span class="order">제 <strong>04</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2014.03.01. ~ 2017.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="info-wrap">
\t\t\t\t\t<div class="inr">
\t\t\t\t\t\t<span class="order">제 <strong>05</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2011.03.01. ~ 2014.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</li>
\t\t</ul>
\t</div>`,
    _extraClass: { tyA: 'container' },
    tyA: {
      list: `\t<div class="list-wrap">
\t\t<ul>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>01</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2023.03.01. ~ 현재
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>02</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2020.03.01. ~ 2023.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>03</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2017.03.01. ~ 2020.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>04</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2014.03.01. ~ 2017.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t</ul>
\t</div>`,
      slide: `\t<div class="list-wrap">
\t\t<ul>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>01</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2023.03.01. ~ 현재
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>02</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2020.03.01. ~ 2023.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>03</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2017.03.01. ~ 2020.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>04</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2014.03.01. ~ 2017.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>05</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2011.03.01. ~ 2014.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>06</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2008.03.01. ~ 2011.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>07</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2005.03.01. ~ 2008.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t\t<li>
\t\t\t\t<div class="inner">
\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/pri_history_A_temp.png" alt=""></p>
\t\t\t\t\t<div class="info">
\t\t\t\t\t\t<span class="order">제 <strong>08</strong> 대</span>
\t\t\t\t\t\t<p><strong>홍길동</strong> 교장</p>
\t\t\t\t\t\t<div class="term">
\t\t\t\t\t\t\t<strong>재임기간</strong>
\t\t\t\t\t\t\t2002.03.01. ~ 2005.02.28.
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<a href="" class="btn-view">약력보기</a>
\t\t\t</li>
\t\t</ul>
\t</div>`,
    },
  },
  symbol: {
    tyA: {
      list: `\t<div class="symbol-sticky">
\t\t<div class="slogan">
\t\t\t<h4>교훈</h4>
\t\t\t<p><strong>정직 &middot; 사랑 &middot; 꿈</strong>을 가꾸는 <strong>어린이</strong></p>
\t\t</div>
\t</div>
\t<div class="list-wrap">
\t\t<div class="box">
\t\t\t<p class="img"><img src="/common/images/sub_com/symbol_temp1.png" alt="00학교 교표 이미지"></p>
\t\t\t<div class="inner">
\t\t\t\t<h4>교표</h4>
\t\t\t\t<p>OO학교의 교표입니다.</p>
\t\t\t</div>
\t\t\t<p class="bg-text">Emblem</p>
\t\t</div>
\t\t<div class="box">
\t\t\t<p class="img"><img src="/common/images/sub_com/symbol_temp2.png" alt="00학교 교기 이미지"></p>
\t\t\t<div class="inner">
\t\t\t\t<h4>교기</h4>
\t\t\t\t<p>OO학교의 교기입니다.</p>
\t\t\t</div>
\t\t\t<p class="bg-text">Flag</p>
\t\t</div>
\t\t<div class="box">
\t\t\t<p class="img"><img src="/common/images/sub_com/symbol_temp3.png" alt="00학교 교화 이미지"></p>
\t\t\t<div class="inner">
\t\t\t\t<h4>교화 <span>연꽃</span></h4>
\t\t\t\t<p>진흙속에 뿌리를 박고 맑지 못한 물에서도 끈기있게 자라서 향기롭고 아름다운 꽃을 피우며, 강인한 줄기는 깊이 감추고 있는 자태는 전통적인 한국 여성의 순결성과도 같아 교화로 지정하여 보호하고 있습니다.</p>
\t\t\t</div>
\t\t\t<p class="bg-text">Flower</p>
\t\t</div>
\t\t<div class="box">
\t\t\t<p class="img"><img src="/common/images/sub_com/symbol_temp4.png" alt="00학교 교목 이미지"></p>
\t\t\t<div class="inner">
\t\t\t\t<h4>교목 <span>소나무</span></h4>
\t\t\t\t<p>소나무는 사계절 푸르름을 잃지 않아 장수와 영원한 생명을 뜻하며, 거센 추위와 바람에도 굳건히 서 있어 절개와 충절의 상징이 됩니다.</p>
\t\t\t</div>
\t\t\t<p class="bg-text">Tree</p>
\t\t</div>
\t\t<div class="box song-wrap">
\t\t\t<div class="tit-wrap">
\t\t\t\t<h4>교가</h4>
\t\t\t\t<div class="btn-wrap">
\t\t\t\t\t<button class="btn-st pri">교가듣기</button>
\t\t\t\t\t<button class="btn-st sec">악보다운로드</button>
\t\t\t\t</div>
\t\t\t</div>
\t\t\t<div class="inner">
\t\t\t\t<div class="img"><p class="rsp_img"><img src="/common/images/sub_com/symbol_song.png" alt="00학교 악보 이미지"></p></div>
\t\t\t\t<div class="lyr">
\t\t\t\t\t<h5>교가 1절</h5>
\t\t\t\t\t<p>유구한 역사의 터전 속에서<br>
\t\t\t\t\t우뚝솟은 광교산의 정기를 받아<br>
\t\t\t\t\t새시들의 새싹들이 자라고 있는<br>
\t\t\t\t\t배움의 보금자리 우리의 서원</p>
\t\t\t\t\t<h5>교가 2절</h5>
\t\t\t\t\t<p>충효의 얼이 깃든 서원 동산에<br>
\t\t\t\t\t심곡혼의 빛난 얼을 가슴에 품고<br>
\t\t\t\t\t우리들의 참된 지혜 초석이 되어<br>
\t\t\t\t\t푸른 꿈 가꿔나갈 서원 어린이</p>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>`,
      slide: `\t<div class="sybmbol-wrap">
\t\t<div class="symbol-sticky">
\t\t\t<div class="slogan">
\t\t\t\t<h4>교훈</h4>
\t\t\t\t<p><strong>정직 &middot; 사랑 &middot; 꿈</strong>을 가꾸는 <strong>어린이</strong></p>
\t\t\t</div>
\t\t</div>
\t\t<div class="list-wrap">
\t\t\t<div class="list-sticky">
\t\t\t\t<div class="scroll-wrap">
\t\t\t\t\t<div class="h-scroll">
\t\t\t\t\t\t<div class="box">
\t\t\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/symbol_temp1.png" alt="00학교 교표 이미지"></p>
\t\t\t\t\t\t\t<div class="inner">
\t\t\t\t\t\t\t\t<h4>교표</h4>
\t\t\t\t\t\t\t\t<p>OO학교의 교표입니다.</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div class="box">
\t\t\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/symbol_temp2.png" alt="00학교 교기 이미지"></p>
\t\t\t\t\t\t\t<div class="inner">
\t\t\t\t\t\t\t\t<h4>교기</h4>
\t\t\t\t\t\t\t\t<p>OO학교의 교기입니다.</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div class="box">
\t\t\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/symbol_temp3.png" alt="00학교 교화 이미지"></p>
\t\t\t\t\t\t\t<div class="inner">
\t\t\t\t\t\t\t\t<h4>교화 <span>연꽃</span></h4>
\t\t\t\t\t\t\t\t<p>진흙속에 뿌리를 박고 맑지 못한 물에서도 끈기있게 자라서 향기롭고 아름다운 꽃을 피우며, 강인한 줄기는 깊이 감추고 있는 자태는 전통적인 한국 여성의 순결성과도 같아 교화로 지정하여 보호하고 있습니다.</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div class="box">
\t\t\t\t\t\t\t<p class="img"><img src="/common/images/sub_com/symbol_temp4.png" alt="00학교 교목 이미지"></p>
\t\t\t\t\t\t\t<div class="inner">
\t\t\t\t\t\t\t\t<h4>교화 <span>소나무</span></h4>
\t\t\t\t\t\t\t\t<p>소나무는 사계절 푸르름을 잃지 않아 장수와 영원한 생명을 뜻하며, 거센 추위와 바람에도 굳건히 서 있어 절개와 충절의 상징이 됩니다.</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>
\t<div class="box song-wrap">
\t\t<div class="tit-wrap">
\t\t\t<h4>교가</h4>
\t\t\t<div class="btn-wrap">
\t\t\t\t<button class="btn-st pri">교가듣기</button>
\t\t\t\t<button class="btn-st sec">악보다운로드</button>
\t\t\t</div>
\t\t</div>
\t\t<div class="inner">
\t\t\t<div class="img"><p class="rsp_img"><img src="/common/images/sub_com/symbol_song.png" alt="00학교 악보 이미지"></p></div>
\t\t\t<div class="lyr">
\t\t\t\t<h5>교가 1절</h5>
\t\t\t\t<p>유구한 역사의 터전 속에서<br>
\t\t\t\t우뚝솟은 광교산의 정기를 받아<br>
\t\t\t\t새시들의 새싹들이 자라고 있는<br>
\t\t\t\t배움의 보금자리 우리의 서원</p>
\t\t\t\t<h5>교가 2절</h5>
\t\t\t\t<p>충효의 얼이 깃든 서원 동산에<br>
\t\t\t\t심곡혼의 빛난 얼을 가슴에 품고<br>
\t\t\t\t우리들의 참된 지혜 초석이 되어<br>
\t\t\t\t푸른 꿈 가꿔나갈 서원 어린이</p>
\t\t\t</div>
\t\t</div>
\t</div>`,
    },
    tyC: `\t<div class="symbol-sticky">
\t\t<h4 id="title">학교 교훈</h4>
\t</div>
\t<div class="list-wrap">
\t\t<div class="box" data-title="학교 교훈">
\t\t\t<h4>학교 교훈</h4>
\t\t\t<div class="inner">
\t\t\t\t<p class="slogan">
\t\t\t\t\t<strong>배움</strong>을 즐겨하고 <strong>예절</strong>을 행동의 <strong>기준</strong>으로 삼는다.
\t\t\t\t</p>
\t\t\t</div>
\t\t</div>
\t\t<div class="box" data-title="학교 상징">
\t\t\t<h4>학교 상징</h4>
\t\t\t<div class="inner">
\t\t\t\t<dl>
\t\t\t\t\t<dt><p class="img"><img src="/common/images/sub_com/symbol_tyC_temp1.png" alt="00학교 교표 이미지"></p></dt>
\t\t\t\t\t<dd>
\t\t\t\t\t\t<h5><span>교표</span>교표</h5>
\t\t\t\t\t\t<p>항상 밝은 마음으로 바르게 살며 주변의 여러가지 여건을 슬기롭게 대처하여 높은 꿈을 실현하는 어린이의 상을 나타냅니다.</p>
\t\t\t\t\t</dd>
\t\t\t\t</dl>
\t\t\t\t<dl>
\t\t\t\t\t<dt><p class="img"><img src="/common/images/sub_com/symbol_temp4.png" alt="00학교 교목 이미지"></p></dt>
\t\t\t\t\t<dd>
\t\t\t\t\t\t<h5><span>교목</span>소나무</h5>
\t\t\t\t\t\t<p>소나무는 사계절 푸르름을 잃지 않아 장수와 영원한 생명을 뜻하며, 거센 추위와 바람에도 굳건히 서 있어 절개와 충절의 상징이 됩니다.</p>
\t\t\t\t\t</dd>
\t\t\t\t</dl>
\t\t\t\t<dl>
\t\t\t\t\t<dt><p class="img"><img src="/common/images/sub_com/symbol_temp3.png" alt="00학교 교화 이미지"></p></dt>
\t\t\t\t\t<dd>
\t\t\t\t\t\t<h5><span>교화</span>연꽃</h5>
\t\t\t\t\t\t<p>진흙속에 뿌리를 박고 맑지 못한 물에서도 끈기있게 자라서 향기롭고 아름다운 꽃을 피우며, 강인한 줄기는 깊이 감추고 있는 자태는 전통적인 한국 여성의 순결성과도 같아 교화로 지정하여 보호하고 있습니다.</p>
\t\t\t\t\t</dd>
\t\t\t\t</dl>
\t\t\t</div>
\t\t</div>
\t\t<div class="box song-wrap" data-title="학교 교가">
\t\t\t<h4>학교 교가</h4>
\t\t\t<div class="inner">
\t\t\t\t<div class="img">
\t\t\t\t\t<h5>○○학교 교가</h5>
\t\t\t\t\t<p class="rsp_img"><img src="/common/images/sub_com/symbol_song.png" alt="00학교 교가 이미지"></p>
\t\t\t\t</div>
\t\t\t\t<div class="song-cont">
\t\t\t\t\t<div class="lyr">
\t\t\t\t\t\t<h5>교가 1절</h5>
\t\t\t\t\t\t<p>유구한 역사의 터전 속에서<br>
\t\t\t\t\t\t우뚝솟은 광교산의 정기를 받아<br>
\t\t\t\t\t\t새시들의 새싹들이 자라고 있는<br>
\t\t\t\t\t\t배움의 보금자리 우리의 서원</p>
\t\t\t\t\t\t<h5>교가 2절</h5>
\t\t\t\t\t\t<p>충효의 얼이 깃든 서원 동산에<br>
\t\t\t\t\t\t심곡혼의 빛난 얼을 가슴에 품고<br>
\t\t\t\t\t\t우리들의 참된 지혜 초석이 되어<br>
\t\t\t\t\t\t푸른 꿈 가꿔나갈 서원 어린이</p>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="btn-wrap">
\t\t\t\t\t\t<button class="btn-st pri">교가듣기</button>
\t\t\t\t\t\t<button class="btn-st sec">악보다운로드</button>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>`,
    tyB: {
      tyB_1: `\t<div class="box">
\t\t<div class="inner">
\t\t\t<p class="slogan">정직ㆍ사랑ㆍ꿈을 가꾸는 어린이</p>
\t\t</div>
\t</div>
\t<div class="box">
\t\t<p class="img mark"><img src="/common/images/sub_com/symbol_tyB_temp1.png" alt="00학교 교표 이미지"></p>
\t\t<div class="inner">
\t\t\t<h4>교표</h4>
\t\t\t<div class="text-box">
\t\t\t\t<p>무궁화꽃과 잎을 소재로 끈기와 애국정신을 기르기 위한 00학교의 자랑스러운 교표</p>
\t\t\t\t<button class="btn-toggle">펼쳐보기</button>
\t\t\t</div>
\t\t</div>
\t</div>
\t<div class="box">
\t\t<p class="img"><img src="/common/images/sub_com/symbol_temp3.png" alt="00학교 교화 이미지"></p>
\t\t<div class="inner">
\t\t\t<h4>교화<span>연꽃</span></h4>
\t\t\t<div class="text-box">
\t\t\t\t<p>진흙속에 뿌리를 박고 맑지 못한 물에서도 끈기있게 자라서 향기롭고 아름다운 꽃을 피우며, 강인한 줄기는 깊이 감추고 있는 자태는 전통적인 한국 여성의 순결성과도 같아 교화로 지정하여 보호하고 있습니다.</p>
\t\t\t\t<button class="btn-toggle">펼쳐보기</button>
\t\t\t</div>
\t\t</div>
\t</div>
\t<div class="box">
\t\t<p class="img"><img src="/common/images/sub_com/symbol_temp4.png" alt="00학교 교목 이미지"></p>
\t\t<div class="inner">
\t\t\t<h4>교목<span>소나무</span></h4>
\t\t\t<div class="text-box">
\t\t\t\t<p>소나무는 사계절 푸르름을 잃지 않아 장수와 영원한 생명을 뜻하며, 거센 추위와 바람에도 굳건히 서 있어 절개와 충절의 상징이 됩니다.</p>
\t\t\t\t<button class="btn-toggle">펼쳐보기</button>
\t\t\t</div>
\t\t</div>
\t</div>
\t<div class="box song-wrap">
\t\t<h4>교가</h4>
\t\t<div class="inner">
\t\t\t<div class="img">
\t\t\t\t<h5>○○학교 교가</h5>
\t\t\t\t<p class="rsp_img"><img src="/common/images/sub_com/symbol_song.png" alt="00학교 교가 이미지"></p>
\t\t\t</div>
\t\t\t<div class="song-cont">
\t\t\t\t<div class="lyr">
\t\t\t\t\t<h5>교가 1절</h5>
\t\t\t\t\t<p>유구한 역사의 터전 속에서<br>
\t\t\t\t\t우뚝솟은 광교산의 정기를 받아<br>
\t\t\t\t\t새시들의 새싹들이 자라고 있는<br>
\t\t\t\t\t배움의 보금자리 우리의 서원</p>
\t\t\t\t\t<h5>교가 2절</h5>
\t\t\t\t\t<p>충효의 얼이 깃든 서원 동산에<br>
\t\t\t\t\t심곡혼의 빛난 얼을 가슴에 품고<br>
\t\t\t\t\t우리들의 참된 지혜 초석이 되어<br>
\t\t\t\t\t푸른 꿈 가꿔나갈 서원 어린이</p>
\t\t\t\t</div>
\t\t\t\t<div class="btn-wrap">
\t\t\t\t\t<button class="btn-st pri">교가듣기</button>
\t\t\t\t\t<button class="btn-st sec">악보다운로드</button>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>`,
    },
  },
  roadmap: {
    tyA: `\t<div class="container">
\t\t<h3 class="title"><span>오시는 길</span>을 <span>소개</span>합니다.</h3>
\t\t<div class="info">
\t\t\t<ul class="info-list">
\t\t\t\t<li class="w100"><span>주소.</span> [35203] 대전광역시 서구 둔산대로 117번길, 95 케이엘학교</li>
\t\t\t\t<li><span>Tel.</span> 123-456-7890</li>
\t\t\t\t<li><span>Fax.</span> 123-456-7899</li>
\t\t\t</ul>
\t\t\t<a href="" class="btn-search">카카오맵 길찾기</a>
\t\t</div>
\t\t<div class="map-wrap">
\t\t\t<div class="map-box">
\t\t\t\t<img src="/common/images/sub_com/map.png" alt="">
\t\t\t</div>
\t\t</div>
\t\t<div class="map-list">
\t\t\t<div class="box bus">
\t\t\t\t<span>버스</span>
\t\t\t\t<ul>
\t\t\t\t\t<li><span>주변버스</span>
\t\t\t\t\t\t<ul class="bus-list">
\t\t\t\t\t\t\t<li><em class="org">지선</em>123, 456</li>
\t\t\t\t\t\t\t<li><em class="grn">순환</em>78, 90, 100</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</li>
\t\t\t\t\t<li><span>주변정류장</span>
\t\t\t\t\t\t<ul class="stop-list">
\t\t\t\t\t\t\t<li><em>1</em>케이엘유치원</li>
\t\t\t\t\t\t\t<li><em>2</em>케이엘초등학교</li>
\t\t\t\t\t\t\t<li><em>3</em>케이엘중학교</li>
\t\t\t\t\t\t\t<li><em>4</em>케이엘고등학교</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</li>
\t\t\t\t</ul>
\t\t\t</div>
\t\t\t<div class="box subway">
\t\t\t\t<span>지하철</span>
\t\t\t\t<ul>
\t\t\t\t\t<li><span>1호선 이용</span><em class="org">1</em>대한역 3번 출구 도보 5분</li>
\t\t\t\t\t<li><span>5호선 이용</span><em class="brown">5</em>민국역 1번 출구 도보 12분</li>
\t\t\t\t</ul>
\t\t\t</div>
\t\t\t<div class="box car">
\t\t\t\t<span>자가용</span>
\t\t\t\t<ul>
\t\t\t\t\t<li><span>대한IC 이용</span>대한교차로에서 입구 고가도로 방향 직진 → 국민사거리 지나 직진 → 농협사거리 지나 직진 →<br>대한파출소 지나 바로 우회전하고 한 블럭 다시 좌회전 (소요시간 약 11분)</li>
\t\t\t\t</ul>
\t\t\t</div>
\t\t</div>
\t</div>`,
    tyB: `\t<div class="container">
\t\t<div class="map-wrap">
\t\t\t<div class="map-box">
\t\t\t\t<img src="/common/images/sub_com/map.png" alt="">
\t\t\t</div>
\t\t\t<div class="info">
\t\t\t\t<h3 class="title">Contact us</h3>
\t\t\t\t<ul class="info-list">
\t\t\t\t\t<li><img src="/common/images/sub_com/lct_Ico.png" alt="">학교 주소 학교 주소가 들어갑니다</li>
\t\t\t\t\t<li class="phone"><img src="/common/images/sub_com/call_Ico.png" alt="">123.456.789</li>
\t\t\t\t</ul>
\t\t\t\t<a href="" class="btn-search">kakao map<i class="ri-share-box-line" aria-hidden="true"></i></a>
\t\t\t</div>
\t\t</div>
\t\t<div class="map-list">
\t\t\t<div class="box bus">
\t\t\t\t<span>버스</span>
\t\t\t\t<ul>
\t\t\t\t\t<li><span>주변정류장</span>
\t\t\t\t\t\t<ul class="stop-list">
\t\t\t\t\t\t\t<li><em>1</em>케이엘유치원</li>
\t\t\t\t\t\t\t<li><em>2</em>케이엘초등학교</li>
\t\t\t\t\t\t\t<li><em>3</em>케이엘중학교</li>
\t\t\t\t\t\t\t<li><em>4</em>케이엘고등학교</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</li>
\t\t\t\t\t<li><span>주변버스</span>
\t\t\t\t\t\t<ul class="bus-list">
\t\t\t\t\t\t\t<li><em class="org">지선</em>4401, 4402</li>
\t\t\t\t\t\t\t<li><em class="grn">순환</em>41, 42, 43</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</li>
\t\t\t\t</ul>
\t\t\t</div>
\t\t\t<div class="box subway">
\t\t\t\t<span>지하철</span>
\t\t\t\t<ul>
\t\t\t\t\t<li><span><em class="org">1</em>1호선 이용시</span>대한역 3번 출구 도보 5분</li>
\t\t\t\t\t<li><span><em class="purp">5</em>5호선 이용시</span>민국역 1번 출구 도보 12분</li>
\t\t\t\t</ul>
\t\t\t</div>
\t\t</div>
\t</div>`,
    tyC: `\t<div class="container">
\t\t<div class="map-wrap">
\t\t\t<h3 class="title">케이엘학교 <span>오시는길</span></h3>
\t\t\t<div class="map-box">
\t\t\t\t<img src="/common/images/sub_com/map.png" alt="">
\t\t\t\t<div class="map-button">
\t\t\t\t\t<a href="" class="kakao">카카오맵 길찾기<i class="ri-arrow-right-s-line" aria-hidden="true"></i></a>
\t\t\t\t\t<a href="" class="naver">네이버 길찾기<i class="ri-arrow-right-s-line" aria-hidden="true"></i></a>
\t\t\t\t</div>
\t\t\t</div>
\t\t\t<div class="info">
\t\t\t\t<ul class="info-list">
\t\t\t\t\t<li>
\t\t\t\t\t\t<img src="/common/images/sub_com/rdm_Ico01.png" alt="">
\t\t\t\t\t\t<span>주소</span>
\t\t\t\t\t\t<p class="txt">해당 영역은 주소가<br> 들어가는 영역입니다.</p>
\t\t\t\t\t</li>
\t\t\t\t\t<li>
\t\t\t\t\t\t<img src="/common/images/sub_com/rdm_Ico02.png" alt="">
\t\t\t\t\t\t<span>전화</span>
\t\t\t\t\t\t<p class="txt">123-456-7890</p>
\t\t\t\t\t</li>
\t\t\t\t\t<li>
\t\t\t\t\t\t<img src="/common/images/sub_com/rdm_Ico03.png" alt="">
\t\t\t\t\t\t<span>팩스</span>
\t\t\t\t\t\t<p class="txt">123-456-7891</p>
\t\t\t\t\t</li>
\t\t\t\t</ul>
\t\t\t</div>
\t\t</div>
\t\t<div class="map-list">
\t\t\t<div class="box bus">
\t\t\t\t<div class="ico">
\t\t\t\t\t<i class="ri-bus-line" aria-hidden="true"></i>
\t\t\t\t</div>
\t\t\t\t<p><span>버스</span>로<br> 오시는 경우</p>
\t\t\t\t<ul>
\t\t\t\t\t<li><span>주변버스 :</span>
\t\t\t\t\t\t<ul class="bus-list">
\t\t\t\t\t\t\t<li><em class="org">지선</em>123, 456</li>
\t\t\t\t\t\t\t<li><em class="grn">순환</em>78, 90, 100</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</li>
\t\t\t\t\t<li><span>주변정류장 :</span>
\t\t\t\t\t\t<ul class="stop-list">
\t\t\t\t\t\t\t<li><em>1</em>케이엘유치원</li>
\t\t\t\t\t\t\t<li><em>2</em>케이엘초등학교</li>
\t\t\t\t\t\t\t<li><em>3</em>케이엘중학교</li>
\t\t\t\t\t\t\t<li><em>4</em>케이엘고등학교</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</li>
\t\t\t\t</ul>
\t\t\t</div>
\t\t\t<div class="box subway">
\t\t\t\t<div class="ico">
\t\t\t\t\t<i class="ri-subway-line" aria-hidden="true"></i>
\t\t\t\t</div>
\t\t\t\t<p><span>지하철</span>로<br> 오시는 경우</p>
\t\t\t\t<ul>
\t\t\t\t\t<li><span>1호선 이용 :</span><em class="org">1</em>대한역 3번 출구 도보 5분</li>
\t\t\t\t\t<li><span>5호선 이용 :</span><em class="purp">5</em>민국역 1번 출구 도보 12분</li>
\t\t\t\t</ul>
\t\t\t</div>
\t\t\t<div class="box car">
\t\t\t\t<div class="ico">
\t\t\t\t\t<i class="ri-car-line" aria-hidden="true"></i>
\t\t\t\t</div>
\t\t\t\t<p><span>자가용</span>로<br> 오시는 경우</p>
\t\t\t\t<ul>
\t\t\t\t\t<li><span>대한IC 이용 :</span>대한교차로에서 입구 고가도로 방향 직진 ㅡ 국민사거리 지나 직진 ㅡ 농협사거리 지나 직진 ㅡ 대한파출소 지나 바로 우회전하고 한 블럭 다시 좌회전 (소요시간 약 11분)</li>
\t\t\t\t</ul>
\t\t\t</div>
\t\t</div>
\t</div>`,
  },
  'class-list': `\t<div class="list-wrap">
\t\t<ul>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp1.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 1학년</strong>
\t\t\t\t\t<span class="num">1반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp2.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 1학년</strong>
\t\t\t\t\t<span class="num">2반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp3.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 1학년</strong>
\t\t\t\t\t<span class="num">3반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp4.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 1학년</strong>
\t\t\t\t\t<span class="num">4반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t</ul>
\t</div>
\t<div class="list-wrap">
\t\t<ul>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp1.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 2학년</strong>
\t\t\t\t\t<span class="num">1반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp2.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 2학년</strong>
\t\t\t\t\t<span class="num">2반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp3.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 2학년</strong>
\t\t\t\t\t<span class="num">3반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp4.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 2학년</strong>
\t\t\t\t\t<span class="num">4반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp4.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 2학년</strong>
\t\t\t\t\t<span class="num">5반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t</ul>
\t</div>
\t<div class="list-wrap">
\t\t<ul>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp1.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 3학년</strong>
\t\t\t\t\t<span class="num">1반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp2.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 3학년</strong>
\t\t\t\t\t<span class="num">2반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp3.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 3학년</strong>
\t\t\t\t\t<span class="num">3반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp4.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 3학년</strong>
\t\t\t\t\t<span class="num">4반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp2.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 3학년</strong>
\t\t\t\t\t<span class="num">5반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp3.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 3학년</strong>
\t\t\t\t\t<span class="num">6반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp4.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 3학년</strong>
\t\t\t\t\t<span class="num">7반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t</ul>
\t</div>
\t<div class="list-wrap">
\t\t<ul>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp1.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 4학년</strong>
\t\t\t\t\t<span class="num">1반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp2.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 4학년</strong>
\t\t\t\t\t<span class="num">2반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp3.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 4학년</strong>
\t\t\t\t\t<span class="num">3반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t\t<li><a href="">
\t\t\t\t<p><img src="/common/images/sub_com/class_temp4.png" alt=""></p>
\t\t\t\t<div class="inr">
\t\t\t\t\t<strong>초등학교 4학년</strong>
\t\t\t\t\t<span class="num">4반</span>
\t\t\t\t\t<span class="count">25명</span>
\t\t\t\t</div>
\t\t\t</a></li>
\t\t</ul>
\t</div>`,
  default: `\t<h2 class="tit1">정직 · 사랑 · 꿈을 가꾸는 어린이</h2>
\t<div class="indent">
\t\t<h3 class="tit2">교표</h3>
\t\t<p>무궁화꽃과 잎을 소재로 만든 기와 애국정신을 기르기 위한 학교의 자랑스러운 교표</p>
\t\t<h3 class="tit2">교화 연꽃</h3>
\t\t<p>진흙속에 뿌리를 박고 맑지 못한 물에서도 깨끗하게 자라서 향기롭고 아름다운 꽃을 피웁니다.</p>
\t\t<h3 class="tit2">교목 소나무</h3>
\t\t<p>소나무는 사계절 푸르름을 잃지 않아 장수와 영원한 생명을 뜻하며, 절개와 충절의 상징이 됩니다.</p>
\t</div>`,
}

const mockFigma = (component_type, variant, subVariant = '') => {
  const noVariant = new Set(['class-list'])
  const comp = MOCK_FIGMA_INNERS[component_type] ?? MOCK_FIGMA_INNERS.default

  // _extraClass: 문자열(전체 공통) 또는 { tyA: 'list', ... }(variant별)
  const ecRaw = typeof comp === 'object' ? comp._extraClass : undefined
  const extraClass = ecRaw
    ? (typeof ecRaw === 'string' ? ` ${ecRaw}` : (ecRaw[variant] ? ` ${ecRaw[variant]}` : ''))
    : ''

  // variant 콘텐츠 → subVariant가 있으면 한 단계 더 들어감
  const varComp = typeof comp === 'object'
    ? (comp[variant] ?? comp._default ?? MOCK_FIGMA_INNERS.default)
    : comp
  const inner = subVariant && typeof varComp === 'object'
    ? (varComp[subVariant] ?? varComp[Object.keys(varComp).find(k => !k.startsWith('_'))])
    : typeof varComp === 'object' ? (varComp._default ?? MOCK_FIGMA_INNERS.default) : varComp

  const subClass = subVariant ? ` ${subVariant}` : ''
  const cls = (noVariant.has(component_type)
    ? component_type
    : `${component_type} ${variant}`) + subClass + extraClass
  return {
    html: `<div class="${cls}">\n${inner}\n</div>`,
    frame_count: 1,
    file_key: 'MOCK_KEY',
    node_ids: ['0:1'],
  }
}

const MOCK_MARKUP = `<h2 class="tit1">개인정보 처리방침</h2>
<h3 class="tit2">제1조 (개인정보의 처리 목적)</h3>
<div class="indent">
\t<p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
\t<ol class="list_ol1">
\t\t<li><span class="num">1</span>서비스 제공</li>
\t\t<li><span class="num">2</span>회원 관리</li>
\t\t<li><span class="num">3</span>마케팅 활용</li>
\t</ol>
</div>
<h3 class="tit2">제2조 (개인정보의 처리 및 보유 기간)</h3>
<div class="indent">
\t<p>이용자의 개인정보는 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
\t<div class="tbl_st scroll_gr" tabindex="0">
\t\t<table>
\t\t\t<caption>개인정보 보유 기간</caption>
\t\t\t<colgroup>
\t\t\t\t<col style="width:33.33%">
\t\t\t\t<col style="width:33.33%">
\t\t\t\t<col style="width:33.33%">
\t\t\t</colgroup>
\t\t\t<thead>
\t\t\t\t<tr>
\t\t\t\t\t<th scope="col">항목</th>
\t\t\t\t\t<th scope="col">수집 목적</th>
\t\t\t\t\t<th scope="col">보유 기간</th>
\t\t\t\t</tr>
\t\t\t</thead>
\t\t\t<tbody>
\t\t\t\t<tr>
\t\t\t\t\t<td>이름, 이메일</td>
\t\t\t\t\t<td>회원 가입</td>
\t\t\t\t\t<td>회원 탈퇴 시</td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<td class="al">
\t\t\t\t\t\t<ul class="list_st1">
\t\t\t\t\t\t\t<li>접속 IP</li>
\t\t\t\t\t\t\t<li>쿠키</li>
\t\t\t\t\t\t</ul>
\t\t\t\t\t</td>
\t\t\t\t\t<td>서비스 이용 기록</td>
\t\t\t\t\t<td>3개월</td>
\t\t\t\t</tr>
\t\t\t</tbody>
\t\t</table>
\t</div>
</div>`

const isValidUrl = (str) => {
  try {
    const u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

async function safeJson(res) {
  const text = await res.text()
  try { return JSON.parse(text) } catch {
    throw new Error(`서버 오류 (${res.status}): ${text.slice(0, 200)}`)
  }
}

const isValidFigmaUrl = (str) => {
  return /figma\.com\/(file|design|proto)\/[A-Za-z0-9]+/.test(str)
}

async function apiFigmaMarkup(url, component_type, variant) {
  if (DEV_MOCK) {
    await new Promise(r => setTimeout(r, 800))
    return mockFigma(component_type, variant)
  }
  const res = await fetch(`${API_BASE}/figma-markup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, component_type, variant }),
  })
  const data = await safeJson(res)
  if (!res.ok) throw new Error(data.detail || '피그마 마크업 실패')
  return data
}

const COMPONENT_TYPES = [
  { value: 'greeting', label: '인사말' },
  { value: 'history', label: '연혁' },
  { value: 'pri-his', label: '역대교장' },
  { value: 'symbol', label: '학교상징' },
  { value: 'roadmap', label: '오시는길' },
  { value: 'class-list', label: '학급목록' },
]

const NO_VARIANT_TYPES = new Set(['class-list'])

const VARIANTS = [
  { value: 'tyA', label: 'tyA' },
  { value: 'tyB', label: 'tyB' },
  { value: 'tyC', label: 'tyC' },
]

// 특정 컴포넌트+타입 조합에서 추가 서브타입 선택이 필요한 경우
const COMPONENT_SUB_VARIANTS = {
  'pri-his': {
    tyA: [
      { value: 'list', label: 'list' },
      { value: 'slide', label: 'slide' },
    ],
  },
  symbol: {
    tyA: [
      { value: 'list', label: 'list' },
      { value: 'slide', label: 'slide' },
    ],
    tyB: [
      { value: 'tyB_1', label: 'B-1' },
      { value: 'tyB_2', label: 'B-2' },
    ],
  },
}


async function apiAutoMarkup(url, selector) {
  if (DEV_MOCK) {
    await new Promise(r => setTimeout(r, 800))
    return { html: MOCK_MARKUP, crawled: MOCK_CRAWL }
  }
  const res = await fetch(`${API_BASE}/auto-markup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, selector }),
  })
  const data = await safeJson(res)
  if (!res.ok) throw new Error(data.detail || '마크업 실패')
  return data
}

async function apiMarkupFromUrl(url, selector, template_html) {
  if (DEV_MOCK) {
    await new Promise(r => setTimeout(r, 800))
    return template_html + `\n<!-- [mock] URL 크롤링 적용: ${url} -->`
  }
  const res = await fetch(`${API_BASE}/markup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, selector, template_html }),
  })
  const data = await safeJson(res)
  if (!res.ok) throw new Error(data.detail || '크롤링 마크업 실패')
  return data.html
}

async function apiEditMarkup(html, instruction) {
  if (DEV_MOCK) {
    await new Promise(r => setTimeout(r, 700))
    return html + `\n<!-- [mock] 적용됨: ${instruction} -->`
  }
  const res = await fetch(`${API_BASE}/edit-markup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, instruction }),
  })
  const data = await safeJson(res)
  if (!res.ok) throw new Error(data.detail || '편집 실패')
  return data.html
}

const THEMES = [
  { value: 'purple', label: '보라',   color: '#6600BF' },
  { value: 'blue',   label: '파랑',   color: '#2870FF' },
  { value: 'green',  label: '초록',   color: '#057734' },
  { value: 'navy',   label: '네이비', color: '#002454' },
  { value: 'mint',   label: '민트',   color: '#268F87' },
  { value: 'orange', label: '오렌지', color: '#E56C01' },
]

function PreviewModal({ markup, onClose, extraCss = false, templateCss = false, theme = 'purple', selfContained = false }) {
  let html

  if (selfContained) {
    html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0">
${markup}
</body>
</html>`
  } else {
    const fontLinks = [
      '/common/font/NotoSansKR/fonts.css',
      '/common/font/Pretendard/fonts.css',
      '/common/font/Montserrat/fonts.css',
      '/common/font/TitilliumWeb/fonts.css',
      '/common/font/remixIcon/remixicon.css',
    ].map(href => `<link rel="stylesheet" href="${href}">`).join('\n')

    const cssLinks = [
      '/theme.css',
      '/basic.css',
      '/con_com.css',
      ...(extraCss ? ['/sub_com.css'] : []),
      ...(templateCss ? ['/template.css'] : []),
    ].map(href => `<link rel="stylesheet" href="${href}">`).join('\n')

    const scripts = [
      '/common/js/jquery.min.js',
      '/common/js/swiper/swiper.min.js',
      '/common/js/common.js',
      '/common/js/con_com.js',
    ].map(src => `<script src="${src}"></script>`).join('\n')

    const body = `<div id="wrap" data-theme="${theme}" style="padding:2rem">\n${markup}\n</div>`

    html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${fontLinks}
<link rel="stylesheet" href="/common/js/swiper/swiper.min.css">
${cssLinks}
</head>
<body style="margin:0">
${body}
${scripts}
</body>
</html>`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>마크업 미리보기</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <iframe
          className="modal-iframe"
          srcDoc={html}
        />
      </div>
    </div>
  )
}

function MarkupResultPanel({ markup, onMarkupChange, extraCss = false, templateCss = false, theme = 'purple', selfContained = false }) {
  const [editPrompt, setEditPrompt] = useState('')
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editError, setEditError] = useState('')
  const [crawlUrl, setCrawlUrl] = useState('')
  const [crawlSelector, setCrawlSelector] = useState('')
  const [loadingCrawl, setLoadingCrawl] = useState(false)
  const [crawlError, setCrawlError] = useState('')

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markup)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCrawlFill = async () => {
    if (!crawlUrl) return
    setLoadingCrawl(true)
    setCrawlError('')
    try {
      const newMarkup = await apiMarkupFromUrl(crawlUrl, crawlSelector, markup)
      onMarkupChange(newMarkup)
    } catch (e) {
      setCrawlError(e.message)
    } finally {
      setLoadingCrawl(false)
    }
  }

  const handleEdit = async () => {
    if (!editPrompt) return
    setLoadingEdit(true)
    setEditError('')
    try {
      const newMarkup = await apiEditMarkup(markup, editPrompt)
      onMarkupChange(newMarkup)
      setEditPrompt('')
    } catch (e) {
      setEditError(e.message)
    } finally {
      setLoadingEdit(false)
    }
  }

  return (
    <div className="markup-result">
      <div className="markup-actions">
        <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copyToClipboard}>
          {copied ? '복사됨 ✓' : '복사'}
        </button>
        <button className="preview-btn" onClick={() => setShowPreview(true)}>미리보기</button>
      </div>
      <textarea
        className="markup-editor"
        value={markup}
        onChange={e => onMarkupChange(e.target.value)}
        spellCheck={false}
      />
      {editError && <div className="error-box" style={{ marginTop: '8px' }}>{editError}</div>}
      <div className="prompt-edit-section">
        <p className="prompt-edit-label">AI로 수정하기</p>
        <div className="prompt-edit-row">
          <input
            className="edit-prompt-input"
            type="text"
            value={editPrompt}
            onChange={e => setEditPrompt(e.target.value)}
            placeholder='예: td에 class="al"을 추가해줘 / th는 가운데 정렬해줘'
            onKeyDown={e => e.key === 'Enter' && !loadingEdit && handleEdit()}
            disabled={loadingEdit}
          />
          <button className="edit-prompt-btn" onClick={handleEdit} disabled={loadingEdit || !editPrompt}>
            {loadingEdit ? '적용 중...' : '적용'}
          </button>
        </div>
      </div>
      {showPreview && <PreviewModal markup={markup} onClose={() => setShowPreview(false)} extraCss={extraCss} templateCss={templateCss} theme={theme} selfContained={selfContained} />}
    </div>
  )
}

function FigmaPanel() {
  const [figmaUrl, setFigmaUrl] = useState('')
  const [figmaUrlError, setFigmaUrlError] = useState('')
  const [compType, setCompType] = useState('greeting')
  const [variant, setVariant] = useState('tyA')
  const [subVariant, setSubVariant] = useState('')
  const [theme, setTheme] = useState('purple')
  const [loading, setLoading] = useState(false)
  const [markupResult, setMarkupResult] = useState(null)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  const [crawlUrl, setCrawlUrl] = useState('')
  const [crawlUrlError, setCrawlUrlError] = useState('')
  const [loadingCrawl, setLoadingCrawl] = useState(false)
  const [crawlError, setCrawlError] = useState('')
  const [needsSelector, setNeedsSelector] = useState(false)
  const [crawlSelector, setCrawlSelector] = useState('')
  const [crawlDone, setCrawlDone] = useState(false)
  const [editPrompt, setEditPrompt] = useState('')
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  const DETECT_FAIL_MSG = '본문 영역을 자동으로 감지하지 못했습니다'
  const showVariant = !NO_VARIANT_TYPES.has(compType)
  const subVariants = COMPONENT_SUB_VARIANTS[compType]?.[variant] ?? []

  // 컴포넌트/타입 변경 시 즉시 템플릿 갱신
  useEffect(() => {
    setCrawlDone(false)
    if (subVariants.length > 0 && !subVariant) { setMarkupResult(''); return }
    const data = mockFigma(compType, variant, subVariant)
    setMarkupResult(data.html)
  }, [compType, variant, subVariant])

  const handleFigmaMarkup = async () => {
    if (subVariants.length > 0 && !subVariant) { alert('서브타입을 선택해주세요.'); return }
    if (!figmaUrl) { setFigmaUrlError('Figma URL을 입력해주세요.'); return }
    if (!isValidFigmaUrl(figmaUrl)) { setFigmaUrlError('올바른 Figma URL이 아닙니다. (예: https://www.figma.com/design/XXXX/...)'); return }
    setFigmaUrlError('')
    setLoading(true)
    setError('')
    try {
      const data = await apiFigmaMarkup(figmaUrl, compType, variant)
      setMarkupResult(data.html)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCrawlFill = async (selectorOverride) => {
    if (subVariants.length > 0 && !subVariant) { alert('서브타입을 선택해주세요.'); return }
    if (!crawlUrl) { setCrawlUrlError('URL을 입력해주세요.'); return }
    if (!isValidUrl(crawlUrl)) { setCrawlUrlError('올바른 URL 형식이 아닙니다.'); return }
    setCrawlUrlError('')
    const sel = selectorOverride ?? crawlSelector
    setLoadingCrawl(true)
    setCrawlError('')
    setNeedsSelector(false)
    try {
      const newMarkup = await apiMarkupFromUrl(crawlUrl, sel, markupResult)
      setMarkupResult(newMarkup)
      setCrawlDone(true)
    } catch (e) {
      setCrawlError(e.message)
      if (e.message.includes(DETECT_FAIL_MSG)) setNeedsSelector(true)
    } finally {
      setLoadingCrawl(false)
    }
  }

  const handleEdit = async () => {
    if (!editPrompt) return
    setLoadingEdit(true)
    setEditError('')
    try {
      const newMarkup = await apiEditMarkup(markupResult, editPrompt)
      setMarkupResult(newMarkup)
      setEditPrompt('')
    } catch (e) {
      setEditError(e.message)
    } finally {
      setLoadingEdit(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(markupResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="input-section">
      <div className="theme-picker">
        {THEMES.map(t => (
          <button
            key={t.value}
            className={`theme-swatch${theme === t.value ? ' active' : ''}`}
            style={{ background: t.color }}
            title={t.label}
            onClick={() => setTheme(t.value)}
          />
        ))}
      </div>

      <div className="figma-comp-row">
        <div className="figma-comp-group">
          <label className="figma-comp-label">컴포넌트</label>
          <select
            className="figma-comp-select"
            value={compType}
            onChange={e => { setCompType(e.target.value); setVariant('tyA'); setSubVariant('') }}
          >
            {COMPONENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {showVariant && (
          <div className="figma-comp-group">
            <label className="figma-comp-label">타입</label>
            <div className="figma-variant-btns">
              {VARIANTS.map(v => (
                <button
                  key={v.value}
                  className={`figma-variant-btn${variant === v.value ? ' active' : ''}`}
                  onClick={() => { setVariant(v.value); setSubVariant('') }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {subVariants.length > 0 && (
          <div className="figma-comp-group">
            <label className="figma-comp-label">서브타입</label>
            <select
              className="figma-comp-select"
              value={subVariant}
              onChange={e => setSubVariant(e.target.value)}
            >
              <option value="">선택</option>
              {subVariants.map(sv => (
                <option key={sv.value} value={sv.value}>{sv.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      {markupResult && (
        <div className="source-panel" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <div className="input-group" style={{ marginBottom: '8px' }}>
            <label>URL</label>
            <div className="crawl-fill-row" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className={`edit-prompt-input${crawlUrlError ? ' input-error' : ''}`}
              value={crawlUrl}
              onChange={e => { setCrawlUrl(e.target.value); setCrawlUrlError(''); setNeedsSelector(false) }}
              placeholder="가져올 서브콘텐츠 URL을 입력하세요."
              onKeyDown={e => e.key === 'Enter' && !loadingCrawl && handleCrawlFill()}
              disabled={loadingCrawl}
              style={{ fontSize: '0.85rem', padding: '10px 14px', height: '48px' }}
            />
            <button
              className="edit-prompt-btn"
              onClick={() => handleCrawlFill()}
              disabled={loadingCrawl || !crawlUrl}
            >
              {loadingCrawl ? '크롤링 중...' : '크롤링'}
            </button>
            </div>
          </div>
          {crawlUrlError && <span className="field-error">{crawlUrlError}</span>}
          {crawlError && (
            <div className="error-box" style={{ marginBottom: '8px' }}>
              <span>{crawlError}</span>
              {needsSelector && (
                <div className="fallback-selector">
                  <input
                    type="text"
                    value={crawlSelector}
                    onChange={e => setCrawlSelector(e.target.value)}
                    placeholder="CSS 셀렉터 직접 입력 (예: #content, .article)"
                    onKeyDown={e => e.key === 'Enter' && crawlSelector && handleCrawlFill(crawlSelector)}
                    autoFocus
                  />
                  <button onClick={() => handleCrawlFill(crawlSelector)} disabled={!crawlSelector || loadingCrawl}>
                    재시도
                  </button>
                </div>
              )}
            </div>
          )}

          <textarea
            className="markup-editor"
            value={markupResult}
            onChange={e => setMarkupResult(e.target.value)}
            spellCheck={false}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button className="preview-btn" onClick={() => setShowPreview(true)}>미리보기</button>
            <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
              {copied ? '복사됨 ✓' : '복사'}
            </button>
          </div>
          {editError && <div className="error-box" style={{ marginTop: '8px' }}>{editError}</div>}
          {crawlDone && (
            <div className="prompt-edit-section">
              <p className="prompt-edit-label">AI로 수정하기</p>
              <div className="prompt-edit-row">
                <input
                  className="edit-prompt-input"
                  type="text"
                  value={editPrompt}
                  onChange={e => setEditPrompt(e.target.value)}
                  placeholder='예: 교장 이름을 홍길동으로 바꿔줘 / 버튼 class를 btn-primary로 변경해줘'
                  onKeyDown={e => e.key === 'Enter' && !loadingEdit && handleEdit()}
                  disabled={loadingEdit}
                />
                <button className="edit-prompt-btn" onClick={handleEdit} disabled={loadingEdit || !editPrompt}>
                  {loadingEdit ? '적용 중...' : '적용'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showPreview && (
        <PreviewModal markup={markupResult} onClose={() => setShowPreview(false)} extraCss={true} theme={theme} />
      )}
    </div>
  )
}

function FigmaUrlPanel() {
  const [figmaUrl, setFigmaUrl] = useState('')
  const [figmaUrlError, setFigmaUrlError] = useState('')
  const [projectName, setProjectName] = useState('')
  const [markupType, setMarkupType] = useState('html')
  const [loading, setLoading] = useState(false)
  const [htmlResult, setHtmlResult] = useState('')
  const [cssResult, setCssResult] = useState('')
  const [jsxResult, setJsxResult] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('html')
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editPrompt, setEditPrompt] = useState('')
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  const isReact = markupType === 'react'
  const hasResult = isReact ? (jsxResult || cssResult) : (htmlResult || cssResult)

  const currentContent = activeTab === 'html' ? htmlResult : activeTab === 'jsx' ? jsxResult : cssResult
  const setCurrentContent = v => {
    if (activeTab === 'html') setHtmlResult(v)
    else if (activeTab === 'jsx') setJsxResult(v)
    else setCssResult(v)
  }

  const handleMarkupTypeChange = type => {
    setMarkupType(type)
    setHtmlResult('')
    setCssResult('')
    setJsxResult('')
    setError('')
    setActiveTab(type === 'react' ? 'jsx' : 'html')
  }

  const handleGenerate = async () => {
    if (!figmaUrl) { setFigmaUrlError('Figma URL을 입력해주세요.'); return }
    if (!isValidFigmaUrl(figmaUrl)) { setFigmaUrlError('올바른 Figma URL이 아닙니다. (예: https://www.figma.com/design/XXXX/...)'); return }
    setFigmaUrlError('')
    setLoading(true)
    setError('')
    setHtmlResult('')
    setCssResult('')
    setJsxResult('')
    try {
      const res = await fetch(`${API_BASE}/figma-accurate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: figmaUrl, markup_type: markupType, project_name: projectName }),
        signal: AbortSignal.timeout(200000),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.detail || '마크업 생성 실패')
      if (markupType === 'react') {
        setJsxResult(data.jsx || '')
        setCssResult(data.css || '')
        setActiveTab('jsx')
      } else {
        setHtmlResult(data.html || '')
        setCssResult(data.css || '')
        setActiveTab('html')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editPrompt || !currentContent) return
    setLoadingEdit(true)
    setEditError('')
    try {
      const newContent = await apiEditMarkup(currentContent, editPrompt)
      setCurrentContent(newContent)
      setEditPrompt('')
    } catch (e) {
      setEditError(e.message)
    } finally {
      setLoadingEdit(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const previewSrcDoc = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
html, body { margin: 0; padding: 0; overflow: auto; }
${cssResult}
</style>
</head>
<body>
${htmlResult}
</body>
</html>`

  const editPlaceholder = activeTab === 'css'
    ? '예: 배경색을 #f5f5f5로 바꿔줘'
    : activeTab === 'jsx'
      ? '예: 버튼 텍스트를 "시작하기"로 바꿔줘'
      : '예: 버튼 텍스트를 "시작하기"로 바꿔줘'

  return (
    <div className="input-section">
      {/* 프로젝트명 */}
      <div className="input-group">
        <label>프로젝트명</label>
        <input
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          placeholder="프로젝트 이름을 입력하세요"
          style={{ fontSize: '0.85rem', padding: '10px 14px', height: '48px' }}
        />
      </div>

      {/* 마크업 종류 */}
      <div className="input-group">
        <label>마크업 종류</label>
        <div className="figma-variant-btns" style={{ marginTop: '6px' }}>
          {[{ value: 'html', label: 'HTML' }, { value: 'react', label: 'React' }].map(opt => (
            <button
              key={opt.value}
              className={`variant-btn${markupType === opt.value ? ' active' : ''}`}
              onClick={() => handleMarkupTypeChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Figma URL */}
      <div className="input-group">
        <label>Figma URL</label>
        <input
          type="text"
          value={figmaUrl}
          onChange={e => { setFigmaUrl(e.target.value); setFigmaUrlError('') }}
          placeholder="https://www.figma.com/design/XXXX/..."
          onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
          className={figmaUrlError ? 'input-error' : ''}
          style={{ fontSize: '0.85rem', padding: '10px 14px', height: '48px' }}
        />
        {figmaUrlError && <span className="field-error">{figmaUrlError}</span>}
      </div>

      <div className="btn-group">
        <button className="markup-btn" onClick={handleGenerate} disabled={loading || !figmaUrl}>
          {loading ? '분석 중...' : '마크업 생성'}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 0', color: '#888' }}>
          <div className="spinner" />
          <span>Figma 스타일 데이터 추출 중... (색상·폰트·여백 정밀 분석 → {isReact ? 'JSX' : 'HTML'}+CSS 생성)</span>
        </div>
      )}

      {hasResult && (
        <div className="result-section">
          <div className="tabs">
            {isReact ? (
              <>
                <button className={activeTab === 'jsx' ? 'tab active' : 'tab'} onClick={() => setActiveTab('jsx')}>JSX</button>
                <button className={activeTab === 'css' ? 'tab active' : 'tab'} onClick={() => setActiveTab('css')}>CSS</button>
              </>
            ) : (
              <>
                <button className={activeTab === 'html' ? 'tab active' : 'tab'} onClick={() => setActiveTab('html')}>HTML</button>
                <button className={activeTab === 'css' ? 'tab active' : 'tab'} onClick={() => setActiveTab('css')}>CSS</button>
              </>
            )}
          </div>
          <div className="tab-content" style={{ padding: 0, border: 'none' }}>
            <div className="markup-result">
              <div className="markup-actions">
                <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
                  {copied ? '복사됨 ✓' : '복사'}
                </button>
                {!isReact && (
                  <button className="preview-btn" onClick={() => setShowPreview(true)}>미리보기</button>
                )}
                {isReact && activeTab === 'css' && (
                  <button className="preview-btn" onClick={() => setShowPreview(true)}>CSS 미리보기</button>
                )}
              </div>
              <textarea
                className="markup-editor"
                value={currentContent}
                onChange={e => setCurrentContent(e.target.value)}
                spellCheck={false}
              />
              {editError && <div className="error-box" style={{ marginTop: '8px' }}>{editError}</div>}
              <div className="prompt-edit-section">
                <p className="prompt-edit-label">AI로 수정하기</p>
                <div className="prompt-edit-row">
                  <input
                    className="edit-prompt-input"
                    type="text"
                    value={editPrompt}
                    onChange={e => setEditPrompt(e.target.value)}
                    placeholder={editPlaceholder}
                    onKeyDown={e => e.key === 'Enter' && !loadingEdit && handleEdit()}
                    disabled={loadingEdit}
                  />
                  <button className="edit-prompt-btn" onClick={handleEdit} disabled={loadingEdit || !editPrompt}>
                    {loadingEdit ? '적용 중...' : '적용'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPreview && hasResult && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>미리보기{projectName ? ` — ${projectName}` : ''} ({isReact ? 'CSS' : 'HTML + CSS'})</span>
              <button className="modal-close" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <iframe className="modal-iframe" srcDoc={previewSrcDoc} />
          </div>
        </div>
      )}
    </div>
  )
}

function ImageMarkupPanel() {
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [markupHtml, setMarkupHtml] = useState('')
  const [markupCss, setMarkupCss] = useState('')
  const [activeTab, setActiveTab] = useState('html')
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const fileInputRef = useRef(null)

  const LOADING_STEPS = [
    '1단계: 레이아웃 구조 분석 중...',
    '2단계: HTML & CSS 생성 중...',
  ]

  const hasResult = !!(markupHtml || markupCss)

  const previewDoc = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="/basic.css">
<style>
${markupCss}
</style>
</head>
<body>
${markupHtml}
</body>
</html>`

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
    setMarkupHtml('')
    setMarkupCss('')
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleReset = () => {
    setImageFile(null)
    setImagePreview('')
    setMarkupHtml('')
    setMarkupCss('')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCopy = () => {
    const content = activeTab === 'html' ? markupHtml : markupCss
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerate = async () => {
    if (!imageFile) return
    setLoading(true)
    setLoadingStep(0)
    setError('')
    setMarkupHtml('')
    setMarkupCss('')

    // 단계별 메시지 전환 (분석 ~20s → 생성)
    const stepTimer = setTimeout(() => setLoadingStep(1), 20000)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      const res = await fetch(`${API_BASE}/image-markup`, {
        method: 'POST',
        body: formData,
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.detail || '마크업 생성 실패')
      setMarkupHtml(data.html || '')
      setMarkupCss(data.css || '')
      setActiveTab('html')
    } catch (e) {
      setError(e.message)
    } finally {
      clearTimeout(stepTimer)
      setLoading(false)
    }
  }

  return (
    <div className="input-section">
      {!imagePreview ? (
        <div
          className={`img-upload-zone${dragging ? ' drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="img-upload-icon">↑</div>
          <p>이미지를 드래그하거나 클릭하여 업로드</p>
          <p className="img-upload-hint">PNG, JPG, GIF 등 이미지 파일 지원</p>
        </div>
      ) : (
        <div className="img-preview-wrap">
          <img src={imagePreview} alt="업로드된 이미지" className="img-preview" />
          <button className="img-reset-btn" onClick={handleReset}>✕ 이미지 제거</button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />

      <div className="btn-group">
        <button
          className="markup-btn"
          onClick={handleGenerate}
          disabled={loading || !imageFile}
        >
          {loading ? '분석 중...' : '마크업 생성'}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading && (
        <div className="img-loading">
          <div className="spinner" />
          <div className="img-loading-steps">
            {LOADING_STEPS.map((msg, i) => (
              <span
                key={i}
                className={`img-loading-step${i === loadingStep ? ' active' : ''}${i < loadingStep ? ' done' : ''}`}
              >
                {i < loadingStep ? '✓ ' : i === loadingStep ? '▶ ' : '○ '}{msg}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasResult && (
        <div className="markup-result">
          <div className="img-code-tabbar">
            <div className="img-code-tabs">
              <button
                className={`img-code-tab${activeTab === 'html' ? ' active' : ''}`}
                onClick={() => setActiveTab('html')}
              >HTML</button>
              <button
                className={`img-code-tab${activeTab === 'css' ? ' active' : ''}`}
                onClick={() => setActiveTab('css')}
              >CSS</button>
            </div>
            <div className="markup-actions">
              <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
                {copied ? '복사됨 ✓' : '복사'}
              </button>
              <button className="preview-btn" onClick={() => setShowPreview(true)}>미리보기</button>
            </div>
          </div>
          <textarea
            className="markup-editor"
            value={activeTab === 'html' ? markupHtml : markupCss}
            onChange={e => activeTab === 'html'
              ? setMarkupHtml(e.target.value)
              : setMarkupCss(e.target.value)}
            spellCheck={false}
          />
        </div>
      )}

      {showPreview && hasResult && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>미리보기 (HTML + CSS)</span>
              <button className="modal-close" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <iframe className="modal-iframe" srcDoc={previewDoc} />
          </div>
        </div>
      )}
    </div>
  )
}

const BROWSERS = [
  { id: 'chrome',  label: 'Chrome' },
  { id: 'edge',    label: 'Edge' },
  { id: 'whale',   label: 'Whale' },
  { id: 'firefox', label: 'Firefox' },
  { id: 'safari',  label: 'Safari' },
  { id: 'ios',     label: 'iOS' },
  { id: 'android', label: 'Android' },
]

function W3cResult({ validation, onToggle, onOpenLightbox }) {
  if (!validation || validation.loading) {
    return (
      <div className="audit-w3c-loading">
        <span className="audit-thumb-spinner" />
        <span>W3C 검사 중...</span>
      </div>
    )
  }
  if (validation.error) {
    return <div className="audit-w3c-fetch-error">검사 실패: {validation.error}</div>
  }
  const msgs = validation.messages ?? []
  const errors = msgs.filter(m => m.type === 'error')
  const warnings = msgs.filter(m => m.type === 'warning' || m.subType === 'warning')
  const infos = msgs.filter(m => m.type === 'info' && m.subType !== 'warning')
  return (
    <div className="audit-w3c-result">
      <button className="audit-w3c-summary" onClick={onToggle}>
        {errors.length === 0 && warnings.length === 0 ? (
          <span className="audit-w3c-ok">오류 없음 ✓</span>
        ) : (
          <>
            {errors.length > 0 && <span className="audit-w3c-tag audit-w3c-tag--error">오류 {errors.length}</span>}
            {warnings.length > 0 && <span className="audit-w3c-tag audit-w3c-tag--warning">경고 {warnings.length}</span>}
            {infos.length > 0 && <span className="audit-w3c-tag audit-w3c-tag--info">정보 {infos.length}</span>}
          </>
        )}
        <span className="audit-w3c-chevron">{validation.open ? '▲' : '▼'}</span>
      </button>
      {validation.open && msgs.length > 0 && (
        <ul className="audit-w3c-list">
          {msgs.map((msg, i) => {
            const isErr = msg.type === 'error'
            const isWarn = msg.type === 'warning' || msg.subType === 'warning'
            const typeClass = isErr ? 'error' : isWarn ? 'warning' : 'info'
            const typeLabel = isErr ? '오류' : isWarn ? '경고' : '정보'
            const remediation = getRemediation(msg.message)
            return (
              <li key={i} className={`audit-w3c-msg audit-w3c-msg--${typeClass}`}>
                <span className="audit-w3c-msg-badge">{typeLabel}</span>
                <div className="audit-w3c-msg-body">
                  <p className="audit-w3c-msg-text">{msg.message}</p>
                  {(msg.lastLine != null) && (
                    <span className="audit-w3c-msg-loc">줄 {msg.lastLine}{msg.firstColumn != null ? `, 열 ${msg.firstColumn}` : ''}</span>
                  )}
                  {msg.extract && (
                    <code className="audit-w3c-msg-extract">{msg.extract}</code>
                  )}
                  {remediation && (
                    <div className="audit-w3c-remediation">
                      <div className="audit-w3c-rem-row">
                        <span className="audit-w3c-rem-label audit-w3c-rem-label--problem">문제</span>
                        <p className="audit-w3c-rem-text">{remediation.problem}</p>
                      </div>
                      <div className="audit-w3c-rem-row">
                        <span className="audit-w3c-rem-label audit-w3c-rem-label--fix">조치</span>
                        <pre className="audit-w3c-rem-text audit-w3c-rem-pre">{remediation.fix}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {validation.open && msgs.length === 0 && (
        <>
          <p className="audit-w3c-empty">검사 결과 메시지가 없습니다.</p>
          {validation.validatorScreenshot && (
            <div className="audit-w3c-evidence">
              <span className="audit-w3c-evidence-label">W3C 검사 결과 화면</span>
              <img
                className="audit-w3c-evidence-thumb"
                src={`data:image/png;base64,${validation.validatorScreenshot}`}
                alt="W3C validator 결과 캡쳐"
                onClick={() => onOpenLightbox(`data:image/png;base64,${validation.validatorScreenshot}`)}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AuditPanel({ type }) {
  const isStandard = type === 'standard'
  const title = isStandard ? '웹표준 증적검사' : '웹접근성 증적검사'

  const [browsers, setBrowsers] = useState(() =>
    Object.fromEntries(BROWSERS.map(b => [b.id, false]))
  )
  const [urls, setUrls] = useState(() =>
    Array.from({ length: 5 }, (_, i) => ({ id: i + 1, value: '' }))
  )
  const [loading, setLoading] = useState(false)
  const [auditProgress, setAuditProgress] = useState({ done: 0, total: 0, phase: '' })
  const [validations, setValidations] = useState({})
  const [screenshots, setScreenshots] = useState({})
  const [lightbox, setLightbox] = useState(null)
  const nextId = useRef(6)

  const MAX_BROWSERS = 5

  const toggleBrowser = (id) => {
    const currentCount = BROWSERS.filter(b => browsers[b.id]).length
    const isChecked = browsers[id]
    if (!isChecked && currentCount >= MAX_BROWSERS) {
      alert(`브라우저는 최대 ${MAX_BROWSERS}개까지 선택 가능합니다.`)
      return
    }
    setBrowsers(prev => ({ ...prev, [id]: !prev[id] }))
  }


  const addUrl = () => {
    setUrls(prev => [...prev, { id: nextId.current++, value: '' }])
  }

  const removeUrl = (id) => {
    if (urls.length <= 1) return
    setUrls(prev => prev.filter(u => u.id !== id))
    setValidations(prev => { const n = { ...prev }; delete n[id]; return n })
    setScreenshots(prev => {
      const next = { ...prev }
      BROWSERS.forEach(b => delete next[`${id}-${b.id}`])
      return next
    })
  }

  const updateUrl = (id, value) => {
    setUrls(prev => prev.map(u => u.id === id ? { ...u, value } : u))
  }

  const toggleValidationOpen = (id) => {
    setValidations(prev => ({
      ...prev,
      [id]: { ...prev[id], open: !prev[id]?.open },
    }))
  }

  const hasAnyUrl = urls.some(u => u.value.trim())
  const hasAnyResult = Object.values(validations).some(v => !v.loading && v.messages !== null)

  const handleAudit = async () => {
    if (!hasAnyUrl) return
    const activeUrls = urls.filter(u => u.value.trim())
    const selectedBrowsers = isStandard ? BROWSERS.filter(b => browsers[b.id]) : []
    if (isStandard && selectedBrowsers.length === 0) {
      alert('브라우저를 1개 이상 선택해주세요.')
      return
    }
    const totalScreenshots = activeUrls.length * selectedBrowsers.length
    const grandTotal = activeUrls.length + totalScreenshots
    setLoading(true)
    setAuditProgress({ done: 0, total: grandTotal, phase: 'W3C 검사 중' })

    // W3C 검사 로딩 초기화
    setValidations(prev => {
      const patch = {}
      activeUrls.forEach(u => { patch[u.id] = { loading: true, messages: null, error: null, open: false } })
      return { ...prev, ...patch }
    })

    // 스크린샷 로딩 초기화 (브라우저 선택된 경우)
    if (selectedBrowsers.length > 0) {
      setScreenshots(prev => {
        const patch = {}
        activeUrls.forEach(u => {
          selectedBrowsers.forEach(b => {
            patch[`${u.id}-${b.id}`] = { dataUrl: null, loading: true, error: null, label: b.label }
          })
        })
        return { ...prev, ...patch }
      })
    }

    // W3C 검사 병렬 실행
    let w3cDone = 0
    await Promise.all(
      activeUrls.map(async (u) => {
        try {
          const res = await fetch('/api/w3c', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: u.value.trim() }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.detail || 'W3C 검사 실패')
          setValidations(prev => ({
            ...prev,
            [u.id]: {
              loading: false,
              messages: data.messages ?? [],
              error: null,
              open: false,
              validatorScreenshot: data.validatorScreenshot ?? null,
            },
          }))
        } catch (e) {
          setValidations(prev => ({
            ...prev,
            [u.id]: { loading: false, messages: null, error: e.message, open: false },
          }))
        } finally {
          w3cDone++
          setAuditProgress({ done: w3cDone, total: grandTotal, phase: 'W3C 검사 중' })
        }
      })
    )

    // 스크린샷 배치 실행
    if (selectedBrowsers.length > 0) {
      const tasks = []
      activeUrls.forEach(u => {
        selectedBrowsers.forEach(b => {
          tasks.push({ urlId: u.id, url: u.value.trim(), browserId: b.id, label: b.label })
        })
      })
      let shotDone = 0
      const BATCH = 3
      for (let i = 0; i < tasks.length; i += BATCH) {
        await Promise.all(
          tasks.slice(i, i + BATCH).map(async ({ urlId, url, browserId, label }) => {
            const key = `${urlId}-${browserId}`
            try {
              const res = await fetch('/api/screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, browser: browserId }),
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.detail || '캡쳐 실패')
              setScreenshots(prev => ({
                ...prev,
                [key]: { dataUrl: `data:image/png;base64,${data.image}`, loading: false, error: null, label },
              }))
            } catch (e) {
              setScreenshots(prev => ({
                ...prev,
                [key]: { dataUrl: null, loading: false, error: e.message, label },
              }))
            } finally {
              shotDone++
              setAuditProgress({ done: activeUrls.length + shotDone, total: grandTotal, phase: '스크린샷 캡처 중' })
            }
          })
        )
      }
    }

    setLoading(false)
    setAuditProgress({ done: 0, total: 0, phase: '' })
  }

  const handleDownload = async () => {
    const activeUrls = urls.filter(u => u.value.trim())
    if (!activeUrls.length) return

    const selectedBrowsers = isStandard ? BROWSERS.filter(b => browsers[b.id]) : []
    const items = []

    for (const u of activeUrls) {
      const val = validations[u.id]
      const messages = val?.messages ?? []
      const errCount = messages.filter(m => m.type === 'error').length
      const warnCount = messages.filter(m => m.type === 'warning' || m.type === 'info').length
      const validatorSs = val?.validatorScreenshot ?? null

      if (selectedBrowsers.length === 0) {
        items.push({
          url: u.value.trim(),
          browser: '',
          w3c_error_count: errCount,
          w3c_warning_count: warnCount,
          validator_screenshot: validatorSs,
          screenshot: null,
        })
      } else {
        for (const b of selectedBrowsers) {
          const shot = screenshots[`${u.id}-${b.id}`]
          const shotB64 = shot?.dataUrl
            ? shot.dataUrl.replace('data:image/png;base64,', '')
            : null
          items.push({
            url: u.value.trim(),
            browser: b.id,
            w3c_error_count: errCount,
            w3c_warning_count: warnCount,
            validator_screenshot: validatorSs,
            screenshot: shotB64,
          })
        }
      }
    }

    try {
      const res = await fetch('/api/download-hwpx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(`다운로드 실패: ${data.detail || res.statusText}`)
        return
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'webstandard_inspection.hwpx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch (e) {
      alert(`오류: ${e.message}`)
    }
  }

  return (
    <div className="input-section">
      <h2 className="audit-title">{title}</h2>

      {isStandard && (
        <div className="audit-browser-section">
          <div className="audit-browser-header">
            <span className="audit-browser-label">브라우저 캡쳐</span>
          </div>
          <div className="audit-browser-list">
            {BROWSERS.map(b => (
              <label key={b.id} className={`audit-browser-chip${browsers[b.id] ? ' checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={browsers[b.id]}
                  onChange={() => toggleBrowser(b.id)}
                />
                {b.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="audit-url-list">
        {urls.map((u, i) => {
          const validation = validations[u.id]
          const urlShots = BROWSERS
            .map(b => ({ ...b, shot: screenshots[`${u.id}-${b.id}`] }))
            .filter(b => b.shot)
          return (
            <div key={u.id} className="audit-url-item">
              <div className="audit-url-row">
                <span className="audit-url-num">{i + 1}</span>
                <input
                  type="text"
                  className="audit-url-input"
                  value={u.value}
                  onChange={e => updateUrl(u.id, e.target.value)}
                  placeholder="검사할 URL을 입력하세요."
                  onKeyDown={e => e.key === 'Enter' && !loading && handleAudit()}
                />
                {urls.length > 1 && (
                  <button className="audit-url-remove" onClick={() => removeUrl(u.id)} title="삭제">✕</button>
                )}
              </div>

              {validation && (
                <div className="audit-url-result-wrap">
                  <W3cResult
                    validation={validation}
                    onToggle={() => toggleValidationOpen(u.id)}
                    onOpenLightbox={(dataUrl) => setLightbox({ dataUrl, label: 'W3C 검사 결과', url: u.value })}
                  />
                </div>
              )}

              {urlShots.length > 0 && (
                <div className="audit-thumb-row">
                  {urlShots.map(b => (
                    <div key={b.id} className="audit-thumb-item">
                      {b.shot.loading ? (
                        <div className="audit-thumb-skeleton">
                          <span className="audit-thumb-spinner" />
                        </div>
                      ) : b.shot.error ? (
                        <div className="audit-thumb-error" title={b.shot.error}>
                          <span>✕</span>
                        </div>
                      ) : (
                        <img
                          className="audit-thumb-img"
                          src={b.shot.dataUrl}
                          alt={`${b.label} 캡쳐`}
                          onClick={() => setLightbox({ dataUrl: b.shot.dataUrl, label: b.label, url: u.value })}
                        />
                      )}
                      <span className="audit-thumb-label">{b.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button className="audit-add-btn" onClick={addUrl}>+ URL 추가</button>

      <div className="btn-group" style={{ marginTop: '24px' }}>
        <button
          className="audit-run-btn"
          onClick={handleAudit}
          disabled={loading || !hasAnyUrl || (isStandard && !BROWSERS.some(b => browsers[b.id]))}
        >
          {loading ? '검사 중...' : '검사 시작'}
        </button>
        {isStandard && hasAnyResult && (
          <button
            className="audit-download-btn"
            onClick={handleDownload}
            disabled={loading}
          >
            파일 다운로드
          </button>
        )}
      </div>

      {loading && auditProgress.total > 0 && (
        <div className="audit-progress-wrap">
          <div className="audit-progress-header">
            <span className="audit-progress-phase">{auditProgress.phase}</span>
            <span className="audit-progress-count">{auditProgress.done} / {auditProgress.total}</span>
          </div>
          <div className="audit-progress-bar">
            <div
              className="audit-progress-fill"
              style={{ width: `${Math.round(auditProgress.done / auditProgress.total * 100)}%` }}
            />
          </div>
        </div>
      )}

      {lightbox && (
        <div className="audit-lightbox" onClick={() => setLightbox(null)}>
          <div className="audit-lightbox-inner" onClick={e => e.stopPropagation()}>
            <div className="audit-lightbox-header">
              <span className="audit-lightbox-title">{lightbox.label} — {lightbox.url}</span>
              <button className="audit-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            </div>
            <img className="audit-lightbox-img" src={lightbox.dataUrl} alt="캡쳐 전체 보기" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [mode, setMode] = useState('single')

  // 단일 모드
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMarkup, setLoadingMarkup] = useState(false)
  const [result, setResult] = useState(null)
  const [markupResult, setMarkupResult] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('text')
  const [fallbackSelector, setFallbackSelector] = useState('')
  const [needsSelector, setNeedsSelector] = useState(false)

  // 일괄 모드
  const [batchRows, setBatchRows] = useState([{ id: 1, url: '', urlError: '' }])
  const [batchResults, setBatchResults] = useState([])
  const [loadingBatch, setLoadingBatch] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })

  // 단일 모드 검증
  const validate = () => {
    if (!url) { setUrlError('URL을 입력해주세요.'); return false }
    if (!isValidUrl(url)) { setUrlError('올바른 URL 형식이 아닙니다. (예: https://example.com)'); return false }
    setUrlError('')
    return true
  }

  const DETECT_FAIL_MSG = '본문 영역을 자동으로 감지하지 못했습니다'

  const handleCrawl = async (selectorOverride) => {
    if (!validate()) return
    const sel = selectorOverride ?? fallbackSelector
    setLoading(true)
    setError(null)
    setNeedsSelector(false)
    setResult(null)
    setMarkupResult(null)

    if (DEV_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      setResult(MOCK_CRAWL)
      setActiveTab('text')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, selector: sel }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.detail || '크롤링 실패')
      setResult(data)
      setActiveTab('text')
    } catch (e) {
      setError(e.message)
      if (e.message.includes(DETECT_FAIL_MSG)) setNeedsSelector(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoMarkup = async () => {
    if (!validate()) return
    setLoadingMarkup(true)
    setError(null)
    setNeedsSelector(false)
    setMarkupResult(null)
    try {
      const data = await apiAutoMarkup(url, fallbackSelector)
      setResult(data.crawled)
      setMarkupResult(data.html)
      setActiveTab('markup')
    } catch (e) {
      setError(e.message)
      if (e.message.includes(DETECT_FAIL_MSG)) setNeedsSelector(true)
    } finally {
      setLoadingMarkup(false)
    }
  }

  // 일괄 모드 핸들러
  const addBatchRow = () =>
    setBatchRows(prev => [...prev, { id: Date.now(), url: '', urlError: '' }])

  const removeBatchRow = (id) =>
    setBatchRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev)

  const updateBatchRow = (id, field, value) =>
    setBatchRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value, [`${field}Error`]: '' } : r))

  const validateBatchRows = () => {
    let hasErrors = false
    setBatchRows(prev => prev.map(row => {
      const u = { urlError: '' }
      if (!row.url) { u.urlError = 'URL을 입력해주세요.'; hasErrors = true }
      else if (!isValidUrl(row.url)) { u.urlError = '올바른 URL 형식이 아닙니다.'; hasErrors = true }
      return { ...row, ...u }
    }))
    return !hasErrors
  }

  const handleBatchMarkup = async () => {
    if (!validateBatchRows()) return
    setLoadingBatch(true)
    setBatchProgress({ current: 0, total: batchRows.length })
    setBatchResults(batchRows.map(r => ({ id: r.id, url: r.url, status: 'pending', markup: null, error: null })))

    for (let i = 0; i < batchRows.length; i++) {
      const row = batchRows[i]
      setBatchProgress({ current: i + 1, total: batchRows.length })
      setBatchResults(prev => prev.map(r => r.id === row.id ? { ...r, status: 'loading' } : r))
      try {
        const data = await apiAutoMarkup(row.url, '')
        setBatchResults(prev => prev.map(r => r.id === row.id ? { ...r, status: 'done', markup: data.html } : r))
      } catch (e) {
        setBatchResults(prev => prev.map(r => r.id === row.id ? { ...r, status: 'error', error: e.message } : r))
      }
    }
    setLoadingBatch(false)
  }

  const updateBatchMarkup = (id, newMarkup) =>
    setBatchResults(prev => prev.map(r => r.id === id ? { ...r, markup: newMarkup } : r))

  return (
    <div className="app">
      <header className="header">
        <h1>Markup Tool</h1>
      </header>

      <main className="main">
        <div className="mode-toggle">
          <div className="mode-group">
            <button className={`mode-btn${mode === 'single' ? ' active' : ''}`} onClick={() => setMode('single')}>크롤링 마크업</button>
            <button className={`mode-btn${mode === 'figma' ? ' active' : ''}`} onClick={() => setMode('figma')}>컴포넌트 마크업</button>
            <button className={`mode-btn${mode === 'figma-url' ? ' active' : ''}`} onClick={() => setMode('figma-url')}>피그마 마크업</button>
            <button className={`mode-btn${mode === 'image-markup' ? ' active' : ''}`} onClick={() => setMode('image-markup')}>이미지 투 마크업</button>
          </div>
          <div className="mode-group mode-group--audit">
            <button className={`mode-btn${mode === 'web-standard' ? ' active' : ''}`} onClick={() => setMode('web-standard')}>웹표준 증적검사</button>
            <button className={`mode-btn${mode === 'web-access' ? ' active' : ''}`} onClick={() => setMode('web-access')}>웹접근성 증적검사</button>
          </div>
        </div>

        {/* 단일 모드 */}
        {mode === 'single' && (
          <>
            <div className="input-section">
              <div className="input-group">
                <label>URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setUrlError(''); setNeedsSelector(false); setFallbackSelector('') }}
                  placeholder="가져올 서브콘텐츠 URL을 입력하세요."
                  onKeyDown={e => e.key === 'Enter' && handleCrawl()}
                  className={urlError ? 'input-error' : ''}
                  style={{ fontSize: '0.85rem', padding: '10px 14px', height: '48px' }}
                />
                {urlError && <span className="field-error">{urlError}</span>}
              </div>
              <div className="btn-group">
                <button className="crawl-btn" onClick={() => handleCrawl()} disabled={loading || loadingMarkup}>
                  {loading ? '크롤링 중...' : '크롤링'}
                </button>
                {result && (
                  <button className="markup-btn" onClick={handleAutoMarkup} disabled={loading || loadingMarkup}>
                    {loadingMarkup ? '마크업 생성 중...' : '자동 마크업'}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="error-box">
                <span>{error}</span>
                {needsSelector && (
                  <div className="fallback-selector">
                    <input
                      type="text"
                      value={fallbackSelector}
                      onChange={e => setFallbackSelector(e.target.value)}
                      placeholder="CSS 셀렉터 직접 입력 (예: #content, .article)"
                      onKeyDown={e => e.key === 'Enter' && fallbackSelector && handleCrawl(fallbackSelector)}
                      autoFocus
                    />
                    <button
                      onClick={() => handleCrawl(fallbackSelector)}
                      disabled={!fallbackSelector || loading}
                    >
                      재시도
                    </button>
                  </div>
                )}
              </div>
            )}

            {result && (
              <div className={`result-section${loadingMarkup ? ' is-loading' : ''}`}>
                {loadingMarkup && (
                  <div className="loading-overlay">
                    <div className="spinner" />
                    <span>마크업 생성 중...</span>
                  </div>
                )}
                <div className="tabs">
                  <button className={activeTab === 'text' ? 'tab active' : 'tab'} onClick={() => setActiveTab('text')}>텍스트</button>
                  {result.images?.length > 0 && (
                    <button className={activeTab === 'ocr' ? 'tab active' : 'tab'} onClick={() => setActiveTab('ocr')}>
                      이미지 OCR ({result.images.length})
                    </button>
                  )}
                  {markupResult && (
                    <button className={activeTab === 'markup' ? 'tab active' : 'tab'} onClick={() => setActiveTab('markup')}>자동 마크업</button>
                  )}
                  {!markupResult && (
                    <button className={activeTab === 'html' ? 'tab active' : 'tab'} onClick={() => setActiveTab('html')}>HTML 코드</button>
                  )}
                  {!markupResult && (
                    <button className={activeTab === 'preview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('preview')}>미리보기</button>
                  )}
                </div>
                <div className="tab-content">
                  {activeTab === 'text' && (
                    <pre className="result-text">{result.text || '(텍스트 없음 — 이미지 OCR 탭을 확인하세요)'}</pre>
                  )}
                  {activeTab === 'ocr' && (
                    <div className="ocr-results">
                      {result.images.map((img, i) => (
                        <div key={i} className="ocr-item">
                          <div className="ocr-meta">
                            <img src={img.src} alt={img.alt} className="ocr-thumb" />
                            <span className="ocr-alt">{img.alt || '(alt 없음)'}</span>
                          </div>
                          <pre className="ocr-text">{img.ocr_text}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'markup' && markupResult && (
                    <MarkupResultPanel markup={markupResult} onMarkupChange={setMarkupResult} />
                  )}
                  {activeTab === 'html' && <pre className="result-html">{result.html}</pre>}
                  {activeTab === 'preview' && (
                    <div className="result-preview" dangerouslySetInnerHTML={{ __html: result.html }} />
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* 피그마 모드 */}
        {mode === 'figma' && <FigmaPanel />}

        {/* 피그마 마크업 모드 */}
        {mode === 'figma-url' && <FigmaUrlPanel />}

        {/* 이미지 투 마크업 */}
        {mode === 'image-markup' && <ImageMarkupPanel />}

        {/* 웹표준 증적검사 */}
        {mode === 'web-standard' && <AuditPanel type="standard" />}

        {/* 웹접근성 증적검사 */}
        {mode === 'web-access' && <AuditPanel type="access" />}

        {/* 일괄 모드 */}
        {mode === 'batch' && (
          <>
            <div className="input-section">
              <div className="batch-header-row">
                <span className="batch-col-label">URL</span>
              </div>
              <div className="batch-rows">
                {batchRows.map((row, i) => (
                  <div key={row.id} className="batch-row">
                    <span className="batch-row-num">{i + 1}</span>
                    <div className="batch-row-fields">
                      <div className="batch-field">
                        <input
                          type="text"
                          value={row.url}
                          onChange={e => updateBatchRow(row.id, 'url', e.target.value)}
                          placeholder="https://example.com"
                          className={row.urlError ? 'input-error' : ''}
                        />
                        {row.urlError && <span className="field-error">{row.urlError}</span>}
                      </div>
                    </div>
                    <button className="batch-remove-btn" onClick={() => removeBatchRow(row.id)} disabled={batchRows.length === 1}>×</button>
                  </div>
                ))}
              </div>
              <div className="batch-footer">
                <button className="batch-add-btn" onClick={addBatchRow} disabled={loadingBatch}>+ 행 추가</button>
                <button className="markup-btn" onClick={handleBatchMarkup} disabled={loadingBatch}>
                  {loadingBatch ? `처리 중... (${batchProgress.current}/${batchProgress.total})` : '일괄 마크업'}
                </button>
              </div>
            </div>

            {batchResults.length > 0 && (
              <div className="batch-results">
                {batchResults.map((item, i) => (
                  <div key={item.id} className={`batch-result-item ${item.status}`}>
                    <div className="batch-result-header">
                      <span className="batch-result-num">{i + 1}</span>
                      <span className="batch-result-url">{item.url}</span>
                      <span className={`batch-result-badge ${item.status}`}>
                        {item.status === 'pending' && '대기'}
                        {item.status === 'loading' && <><span className="spinner-sm" />처리 중</>}
                        {item.status === 'done' && '완료'}
                        {item.status === 'error' && '오류'}
                      </span>
                    </div>
                    {item.status === 'error' && (
                      <div className="batch-result-error">{item.error}</div>
                    )}
                    {item.status === 'done' && item.markup && (
                      <div className="batch-result-body">
                        <MarkupResultPanel
                          markup={item.markup}
                          onMarkupChange={newMarkup => updateBatchMarkup(item.id, newMarkup)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
