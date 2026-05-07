$(function() {
	// 최상단 공지 팝업
	var upPopPrev = '.up_pop .prev';
	var upPopNext = '.up_pop .next';
	var upPopStop = '.up_pop .stop';
	var upPopPlay = '.up_pop .play';
	$("#upPopSlide").slick({
		slider: '.item',
		infinite: true,
		autoplay: true,
		prevArrow: upPopPrev,
		nextArrow: upPopNext,
		slidesToShow: 3,
		responsive: [
			{ breakpoint: 1024, settings: { slidesToShow: 2 }},
			{ breakpoint: 600, settings: { slidesToShow: 1 }}
		]
	});
	$('.up_pop .btn a').click(function(e){
		slickControl($(this), '#upPopSlide', upPopStop, upPopPlay);
		e.preventDefault();
	});

	// 레이어 팝업 : 슬라이드
	var allPopPrev = '.allPopWrap .prev';
	var allPopNext = '.allPopWrap .next';
	$("#allPopSlide").slick({
		slider: '.item',
		infinite: true,
		autoplay: false,
		prevArrow: allPopPrev,
		nextArrow: allPopNext,
		slidesToShow: 3,
		responsive: [
			{ breakpoint: 1024, settings: { slidesToShow: 2 }},
			{ breakpoint: 768, settings: { slidesToShow: 1 }}
		]
	});

	//pop active
	$('.popBtn').on('click', function(e) {
		if ($('#wrap').hasClass('openPop')) {
			$('#wrap').removeClass('openPop');
		} else {
			$('#wrap').addClass('openPop');
		}
		e.preventDefault();
	});
});