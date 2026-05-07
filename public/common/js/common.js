$(function() {
    gnb();
    mGnb();
    footer();
    if($('#snb').length > 0){ SNB(); };
    if($('.sns-box').length > 0){ snsBox(); };

	// HASH 버튼
	var _focus = '';
	$('.hash').on('click', function(e){
		$(this.hash).fadeIn(200).find('a').first().focus();
		// 예외처리(레이어팝업 : 슬라이드) display: none 요소는 슬라이드가 실행되지 않는 오류 발생 - 임의로 클릭이벤트 발생시킴!!
		if($(this.hash).selector === "#allPopupSlider"){
			$("#allPopupSlider").find(".btn > a").click(); 
		}
		_focus = $(this);
		e.preventDefault();
	});
	$('.hashClose').on('click', function(e){
		$(this.hash).fadeOut(200);
		_focus.focus();
		_focus = '';
		e.preventDefault();
	});

	// HASH TOGGLE 버튼
	$('.hashToggle').on('click', function(e){
		($(this).hasClass('active') == true)? $(this).removeClass('active') : $(this).addClass('active');
		$(this.hash).slideToggle(200);
		e.preventDefault();
	});

    $(window).scroll(function() {
        var scrollTop = $(window).scrollTop();

        if (scrollTop > 200) {
            $('.btn_top').fadeIn();
        } else {
            $('.btn_top').fadeOut();
        }
    });

    // 맨위로 가기
    $('.btn_top').click(function(e) {
        e.preventDefault();
        $('html, body').stop().animate({
            scrollTop: 0
        }, 400);
    });

    // 반응형 Active Reset
    var delta = 100;
    var timer = null;
    $(window).on('resize', function() {
        clearTimeout(timer);
        if ($(window).width() > 1024 || $(window).width() <= 1025) {
            timer = setTimeout(resizeDone, delta);
        }
    });

    function resizeDone() {
        $('.box_search_0').removeAttr('style');
        $('.sns-box').removeClass('open');
        $('.sns-box .active').each(function(){
            $(this).removeClass('active');
        });
        $('#mGnb').hide();
    }
});

// 메인메뉴
function gnb() {
    var $nav = $('#nav');
    $gnb = $('#gnb');
    $depth01 = $gnb.find('.depth01');
    $depth02 = $gnb.find('.depth02');
    $depth03 = $gnb.find('.depth03');
    $depth01.li = $depth01.find('> ul > li');
    $depth02.li = $depth02.find('> ul > li');
    $depth03.li = $depth03.find('> ul > li');
    defaultHeight = $depth01.li.innerHeight();

    //setting : 접근성 수정
    $gnb.find('.depth02 li').each(function() {
        if ($(this).find('> div').length > 0) {
            $(this).addClass('dep').find('> a').attr('title', '메뉴닫힘');
        }
    });
    $gnb.find('li').last().find('> a').addClass('lastGnb');
    $depth02.li.last().find('> a').addClass('lastGnb');

    //gnb fullDown : show
    $(document).on('focus mouseover', '#nav.fullDown #gnb a', function(e){
        var idx = $(this).parent().index();
        $('#gnb').addClass('active');
        $(this).parent().addClass('on').siblings().removeClass('on');
        $('#gnb .depth01 > ul > li').eq(idx).addClass('on').siblings().removeClass('on');
        $('#blind').fadeIn(100);
    });
    $(document).on('focus mouseover', '#nav.fullDown .depth01 > ul > li', function(e){
        var idx = $(this).index();
        $(this).addClass('on').siblings().removeClass('on');
    });

    //show : 접근성 수정
	//[주의!!] - 웹 메인메뉴, 웹 전체메뉴(사이트맵), 모바일 메인메뉴 2뎁스 메뉴 영역에서 공통 사용부분입니다.!!! 메뉴 중 단독으로 수정이 필요한 경우에는 분리하여 수정하시기 바랍니다.!!!
    $(document).on('click', '.depth02 li.dep > a', function(e){
		if ($(this).parent().hasClass('active') == true) {
            $(this).parent().removeClass('active');
            $(this).attr('title','메뉴닫힘');
        } else {
            $(this).parent().addClass('active');
            $(this).attr('title','메뉴열림');
        }
		e.preventDefault();
    });

    $depth01.find('> ul > li > a').on('focus mouseover', function() {
        $(this).parent().addClass('on').siblings().removeClass();
    });

    $depth01.li.find('> a').on('focus mouseover', function() {
        $gnb.addClass('active');
    });

    //hide
    $(document).on('mouseleave', '#nav:not(.oneDown) #gnb, #nav.oneDown #gnb .depth02', function(){
        gnbHide();
    });
    
    $(document).on('focusout', '#gnb .lastGnb', function() {
    	if($(this).attr('title') == "메뉴열림"){
    	}else{
    		gnbHide();
    	}        
    });

    function gnbHide(){
        $gnb.removeClass('active').find('li').removeClass('active on');
        ($nav.hasClass('oneDown') == true) ? $depth02.li.removeClass('active'): '';
		$('.depth02 li.dep > a').attr('title', "메뉴닫힘");
    }
}

// 모바일메뉴
function mGnb() {
	
	// 풀메뉴 접근성 수정
	$(document).on('focus mouseover', '.fullmenu', function(e){
		$('#mGnb .depth02 > ul > li.dep > a').removeAttr("title");
		e.preventDefault();
    });
 	$(document).on('focus mouseover click', '#mGnb .depth02 > ul > li.dep > a', function(e){
		$(this).removeAttr("title");
		e.preventDefault();
    });

    // setting
    if ($('#mGnb').length > 0) {
        $("#nav .depth01").clone(false).prependTo("#mGnb .mGnb-wrap, #mGnb .depth01-tab");
        $("#header .util > li").clone(false).prependTo("#mGnb .util-wrap .util");
		$(document).find("#mGnb .depth01 > ul > li").each(function(){
            $(this).removeAttr("style");
            $(this).find('.titBox').remove();
			if ($(this).find('> .depth02').length > 0) {
				$(this).addClass('dep');
			}
		});
        $("#mGnb .depth01-tab").find('.depth02').each(function(){
            $(this).remove();
        });
    }
    // 전체메뉴(사이트맵), 모바일 메인메뉴 활성화
    $('#mGnbOpen').on('click', function(e){
        $('#mGnb').slideDown();
        $('body').addClass('mGnb-open');
        e.preventDefault();
    });
    // 전체메뉴(사이트맵), 모바일 메인메뉴 비활성화
    $('#mGnbClose').on('click focusout', function(e){
        $('#mGnb').slideUp();
        $("#fullmenuOpen").focus();
        $('body').removeClass('mGnb-open');
        e.preventDefault();
    });
    // 전체메뉴(사이트맵), 모바일 메인메뉴 기능 - 주의 : 뎁스 2메뉴부터는 상단에 있는 메뉴 공통 스크립트가 사용되고 뎁스 1메뉴는 조건이 달라 분리함!!
    $(document).on('click', '#mGnb .depth01 > ul > li.dep > a', function(e){
        if ($(window).width() <= 1240) {
			$(this).parent().addClass('active').siblings().removeClass('active');
            e.preventDefault();
        }
    });

    //상단 1차메뉴 클릭
    $('#mGnb .depth01-tab > button').on('click', function(){
        var $tab = $(this).parent('');
       if($tab.hasClass('open') == true){
			$(this).attr('title', '1차메뉴 열기');
			$tab.removeClass('open');
            console.log($tab);
		}else{
			$(this).attr('title', '1차메뉴 닫기');
			$tab.addClass('open');
            console.log($tab);
		}
    });

    const $tab = $('.depth01-tab');

    function setStickyOffset() {
        const tabH = $tab.outerHeight() || 0;
        document.documentElement.style.setProperty(
        '--depth01-tab-height',
        tabH + 'px'
        );
    }

    setStickyOffset();
    $(window).on('resize', setStickyOffset);
}

// SNS
function snsBox() {
	const $shareBtn = $('.sns-box button.btnShare');
    const $shareTxt = $shareBtn.find('.hid');
    const $snsMore  = $('.sns-list');

    function openShare() {
        $snsMore.addClass('active');
        $shareBtn.addClass('active').attr('aria-expanded', 'true');
        $shareTxt.text('공유 닫기');
        $('#sub_container').attr('style', 'z-index: 103');
        $('.sub-header').attr('style', 'z-index: 11');
       ($(window).width() <= 1024) ? $('.sns-box').addClass('open') : '';
    }

    function closeShare() {
        $snsMore.removeClass('active');
        $shareBtn.removeClass('active') .attr('aria-expanded', 'false') .focus();
        $shareTxt.text('공유 열기');
        $('#sub_container, .sub-header').removeAttr('style');
       ($(window).width() <= 1024) ? $('.sns-box').removeClass('open') : '';
    }

    /* 초기 상태 */
    $shareTxt.text('공유 열기');
    $shareBtn.attr('aria-expanded', 'false');

    /* 공유 버튼 클릭 */
    $shareBtn.on('click', function () {
        $(this).hasClass('active') ? closeShare() : openShare();
    });

    /* 마지막 버튼에서 포커스 빠질 때 */
    $snsMore.find('button:last-of-type').on('focusout', function () {
        closeShare();
    });

    /* 닫기 버튼 */
    $('#snsClose').on('click', function (e) {
        e.preventDefault();
        closeShare();
    });

    /* ESC 키로 닫기 (접근성 보너스) */
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $snsMore.hasClass('active')) {
            closeShare();
        }
    });

    /* overlay(배경) 클릭 시 닫기 */
    $(document).on('click', function (e) {

        if ($(window).width() > 1024) return;
        if (!$('.sns-box').hasClass('open')) return;
        if ($(e.target).closest('.sns-box, .sns-list').length) return;

        closeShare();
    });

    
};

// footer 유관기관 Box
function footer(){
    $(".footBtn button").attr("title", "상태 : 축소");
    $('.footBtn button').click(function() {
        $(this).attr("title", "상태 : 확장");
        $(this).parent().siblings('div').children('div').stop().slideUp(300);
        $(this).siblings("div").stop().slideToggle(300);

        if ($(this).parent('.footBtn').hasClass('on')) {
            $('.footBtn').removeClass('on');
            $(this).attr("title", "상태 : 축소");
        } else {
            $('.footBtn').removeClass('on');
            $(this).parent('.footBtn').addClass('on');
            $(this).attr("title", "상태 : 확장");
        }
        return false;
    });

    $(window).on('load', function() {
        $("#footer .footBtn ul li:last-of-type > a").focusout(function(){
            $('.footBtn button').attr("title", "상태 : 축소");
            $('.footBtn div').hide();
            $('.footBtn').removeClass('on');
        });
    });
}

// SNB
function SNB(){

    var $deps = $('#snb .dep');

    /* ===== 공통 함수 ===== */
    function openDep($dep) {
        $dep.addClass('active').find('> button').attr('aria-expanded', 'true').end().find('> ul').stop().slideDown();
    }

    function closeDep($dep) {
        $dep.removeClass('active').find('> button').attr('aria-expanded', 'false').end().find('> ul').stop().slideUp();
    }

    function closeSiblings($dep) {
        $dep.siblings('.dep').each(function () {
            closeDep($(this));
        });
    }

    /* ===== 초기 상태 aria 반영 ===== */
    $deps.each(function () {
        var $dep = $(this);
        $dep.find('> button').attr(
            'aria-expanded',
            $dep.hasClass('active') ? 'true' : 'false'
        );
    });

    /* ===== 클릭 + 키보드 토글 ===== */
    $('#snb .dep > button').on('click keydown', function (e) {
        if (
            e.type === 'keydown' &&
            e.key !== 'Enter' &&
            e.key !== ' '
        ) return;

        e.preventDefault();

        var $dep = $(this).parent('.dep');
        var isOpen = $dep.hasClass('active');

        if (isOpen) {
            closeDep($dep);
        } else {
            openDep($dep);
            closeSiblings($dep);
        }
    });

    /* ===== 포커스가 dep 밖으로 나가면 닫기 ===== */
    $deps.on('focusout', function (e) {
        var $dep = $(this);
        var $next = $(e.relatedTarget);

        // 다음 포커스가 없거나, dep 내부가 아니면 닫기
        if (!$next.length || !$dep.has($next).length) {
            closeDep($dep);
        }
    });


    //스크롤
    const $snb = $('#snb');

    // 자리 유지용 placeholder 생성
    const $placeholder = $('<div class="snb-placeholder"></div>');
    $snb.after($placeholder);

    const snbOffsetTop = $snb.offset().top;
    const snbHeight = $snb.outerHeight();

    function toggleSnb() {
        const scrollTop = $(window).scrollTop();

        if (scrollTop > snbOffsetTop) {
        if (!$snb.hasClass('is-fixed')) {
            $snb.addClass('is-fixed');
            $('body').addClass('snb-fixed');
            $placeholder.height(snbHeight).addClass('is-active');
        }
        } else {
        if ($snb.hasClass('is-fixed')) {
            $snb.removeClass('is-fixed');
            $('body').removeClass('snb-fixed');
            $placeholder.removeClass('is-active').height(0);
        }
        }
    }

    // 초기 실행 + 스크롤 이벤트
    toggleSnb();
    $(window).on('scroll resize', toggleSnb);
}

// 서브메뉴(세로형 메뉴)
function typeVert_snb() {
    //setting
    var $lnb = $(".typeVert .dep01");
    var $sublnb = $(".typeVert .dep02");
    var lnbLink = $('.typeVert .dep01 a');
    var sublnbLink = $('.typeVert .dep01 .dep02 li a');
    var tabLink = $('.typeVert .dep01 li a');
    var tabUpperLink = $('.typeVert .dep01 li');

/*
    var current = $('#pageTitle').text();
    var currMenuId = $('#leftCurrMi').val();
    var tabBaseId = "left_" + $("#tabBaseMi").val();
    var tabUpperId = $("#tabUpperMi").val();
    if ($lnb.size() > 0) {
        lnbLink.each(function() {
			//중복 선택 막기위해 해당 메뉴 id 값도 같이 판별
			if ($(this).text() == current && $(this).attr('href').indexOf("mi=" + currMenuId) > -1) {
				 $(this).parents('li').addClass('open');
				 if ($(this).parent().parent().hasClass('subLnb')) {
					 $(this).parents('.dep02').parent().addClass('open').children("ul").slideDown(0);
				 }
			}
        });

		//4차메뉴
		sublnbLink.each(function() {
			//중복 선택 막기위해 해당 메뉴 id 값도 같이 판별
			if ($(this).attr('id').indexOf("currMenuId" + $("#tabBaseMi").val()) > -1) {
				  $(this).parents('li').addClass('open');
				  if ($(this).parent().parent().hasClass('subLnb')) {
					  $(this).parents('.dep02').parent().addClass("").children("ul").slideDown(0);
					  $(this).children("a").prop('title', "선택됨");
				  }
			}
		});

       //1차 탭 선택시 왼쪽메뉴 선택
       tabLink.each(function() {
           if ($(this).attr('id') == tabBaseId) {
               $(this).prop('title', "선택됨");
               $(this).parents('.dep02').parent().addClass("open").children("ul").slideDown(0);
               //$(this).parents('.subLnb2').parent().addClass("open").children("ul").slideDown(0);

               $("#" + tabBaseId).addClass("open");
               $(this).parent().addClass("open");
           }
       });

       //2차 탭 선택시 왼쪽메뉴 선택
       tabUpperLink.each(function() {
           if ($(this).attr('id') == tabUpperId) {
               $(this).prop('title', "선택됨");
               $(this).parents('.dep02').parent().addClass("open").children("ul").slideDown(0);
               //$(this).parents('.subLnb2').parent().addClass("open").children("ul").slideDown(0);

               $("#" + tabUpperId).addClass("open");
               $(this).addClass("open");
           }
       });
    }
*/
	// 웹접근성 : 페이지 로드시 기본 메뉴 닫힘 생성
    $lnb.find('li').each(function() {
        if ($(this).find('> ul').length > 0) {
            $(this).addClass("dep");
			$(this).find("> a").attr("title","메뉴 닫힘");
			// 현재 메뉴 체크
			($(this).hasClass("open")) ? $(this).find("> a").attr('title', '메뉴 열림') : "";
        }
    });

	// 서브메뉴 클릭시 하위메뉴 열림 / 닫힘
    $(document).on('click', '.typeVert .dep01 li.dep > a', function(e){
		if($(this).parent().hasClass('open')){
			$(this).parent().removeClass('open').siblings().removeClass('open');
			$(this).prop('title', '메뉴 닫힘').parent().siblings('.dep').find('> a').prop('title', '메뉴 닫힘');
		}else{
			$(this).parent().addClass('open').siblings().removeClass('open');
			$(this).prop('title', '메뉴 열림').parent().siblings('.dep').find('> a').prop('title', '메뉴 닫힘');
		}
		e.preventDefault();
    });

    $('#snb h2').click(function() {
        if ($(window).width() <= 1240) {
            $(this).toggleClass('on').next().slideToggle(600);
        }
    });

    /* 반응형 셋팅 */
    $(window).resize(function() {
        var winSize = $(window).outerWidth();
        if (winSize > 1240) {
            $('#snb nav').css('display', 'block');
        } else {
            $('#snb nav').css('display', 'none');
        }
    });
}

//서브메뉴(가로형 메뉴) 
function typeHori_snb(){
	var $snb = $('#snb');
    var $lnb = $(".typeHori .dep01");

	// 웹접근성 : 페이지 로드시 기본 메뉴 닫힘 생성
	$lnb.find('li').each(function() {
        if ($(this).find('> ul').length > 0) {
            $(this).addClass("dep");
			$(this).find("> a").attr("title","메뉴 닫힘");
			// 현재 메뉴 체크
			($(this).hasClass("open")) ? $(this).find("> a").attr('title', '메뉴 열림') : "";
        }
    });

	$snb.find('.snb-wrap .active:last').parents('li').addClass("active");
	$snb.find('li').each(function() {
		if ($(this).hasClass('active') == true) {
			$(this).find('> a').prop('title', ' 메뉴 닫힘'); //접근성 : active 메뉴 타이틀 추가
		}
	});

	$snb.find('a').on('click', function(e) {
		if($(window).width() > 1240 && $(this).parent().hasClass('active')){//웹 메뉴 기능
			var $ul = $(this).parent().parent();
			if ($ul.hasClass('open') == true) {
				$ul.removeClass('open');
                $snb.removeAttr('style');
				$(this).prop('title', ' 메뉴 닫힘'); //접근성 : active 메뉴 타이틀 추가

			}else{
				$('#snb').find('ul.open').removeClass('open');
				$ul.addClass('open');
                $snb.prop('style', 'z-index: 99');
				$(this).prop('title', ' 메뉴 열림'); //접근성 : active 메뉴 타이틀 추가
			}
			e.preventDefault();
		}else if($(window).width() <= 1240 && $(this).parent().hasClass('dep')){ //모바일 메뉴 기능
			if($(this).parent().hasClass('open')){
				$(this).parent().removeClass('open').siblings().removeClass('open');
                $snb.removeAttr('style');
				$(this).prop('title', '메뉴 닫힘').parent().siblings('.dep').find('> a').prop('title', '메뉴 닫힘');
			}else{
				$(this).parent().addClass('open').siblings().removeClass('open');
                $snb.prop('style', 'z-index: 99');
				$(this).prop('title', '메뉴 열림').parent().siblings('.dep').find('> a').prop('title', '메뉴 닫힘');
			}
			e.preventDefault();
		}
	});

	$('#snb h2').click(function() {
		if ($(window).width() <= 1240) {
			$(this).toggleClass('on').next().slideToggle(600);
		}
	});
	
	// 메뉴영역 외부 클릭 시, 메뉴닫기
	$(document).on('click', function(e) {
		if (!$(e.target).parents().is('#snb')) {
			$('#snb ul').removeClass('open');
			$(".dep01 li.active > a").prop('title', '메뉴 닫힘');
		};
	});

	/* 반응형 셋팅 */
    // resize 대응
    var delta = 100;
    var timer = null;
    $(window).on('resize', function() {
        clearTimeout(timer);
        //if (window.matchMedia('(max-width: 1240)').matches || window.matchMedia('(min-width: 1241)').matches) {
        if ($(window).outerWidth() > 1240 || $(window).outerWidth() < 1241) { //$(window).width() > 1240 : 작은사이즈에서 창을 키울때 / $(window).width() < 1241 : 큰사이즈에서 창을 줄일때 timer 딜레이 후에 사이즈 비교
			timer = setTimeout(resizeDone, delta);
        }
    });

    function resizeDone() {
        $('#snb').find('ul').removeClass('open');
    }
}
