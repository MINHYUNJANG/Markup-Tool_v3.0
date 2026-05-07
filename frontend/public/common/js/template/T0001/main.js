$(function() {
	$(window).on('load', function(){
	   $('div[class*="notice"] .titTab li').eq(0).children('a').attr('title','선택됨');
   });
   //notice tab
   $(document).on('click', 'div[class*="notice"] .titTab li > a', function(e){
	   var contents = $(this.hash);

	   $(this).addClass('current').parent('li').siblings().find('a').removeClass('current');
	   $(this).attr('title','선택됨').parent('li').siblings().find('a').attr('title','');
	   $(contents).addClass('on').siblings().removeClass('on');
	   e.preventDefault();
   });

   //main visual
   var visualPrev = '.visual .prev';
   var visualNext = '.visual .next';
   var visualStop = '.visual .stop';
   var visualPlay = '.visual .play';
   $("#visualSlide").on('init', function(event, slick) {
	   $('.visual .control strong').text(slick.currentSlide+1);
	   $('.visual .control span').text(slick.slideCount);
   }).slick({
	   slider: '.item',
	   infinite: true,
	   fade: true,
	   autoplaySpeed: 4000,
	   speed : 500,
	   autoplay: true,
	   prevArrow: visualPrev,
	   nextArrow: visualNext
   }).on('beforeChange', function (event, slick, currentSlide, nextSlide) {
	   $('.visual .control strong').text(nextSlide+1);
   });
   $('.visual .control a').click(function(e){
	   slickControl($(this), '#visualSlide', visualStop, visualPlay);
	   e.preventDefault();
   });

   // main visual resize
   var delta = 100;
   var timer = null;
   $(window).on('resize', function(){
	   clearTimeout(timer);
	   timer = setTimeout( resizeDone, delta );
   });
   function resizeDone() {
	   $("#visualSlide").slick('setPosition');
   }

   //schedule popup
   var returnFocus = '';
   $(document).on('click', '.sche_table a', function(e){
	   returnFocus = $(this);
	   $('#schePop').addClass('active').find('a').focus();
	   e.preventDefault();
   });
   $(document).on('click focusout', '#schePopClose', function(e){
	   $('#schePop').removeClass('active');
	   returnFocus.focus();
	   e.preventDefault();
   });

   //popupZone visual
   var popupPrev = '.popupZone .prev';
   var popupNext = '.popupZone .next';
   var popupStop = '.popupZone .stop';
   var popupPlay = '.popupZone .play';
   $("#popupSlide").on("init", function (event, slick) {
		var totalSlides = slick.slideCount;
		var currentSlideNumber = slick.currentSlide + 1;
		var currentSlideDisplay = currentSlideNumber.toString().padStart(2, '0');
    	var totalSlidesDisplay = totalSlides.toString().padStart(2, '0');		
		$('.popupZone .page strong').text(currentSlideDisplay);
    	$('.popupZone .page span').text(totalSlidesDisplay);
	}).slick({
	   slider: '.item',
	   infinite: true,
	   autoplaySpeed: 4000,
	   speed : 500,
	   autoplay: true,
	   prevArrow: popupPrev,
	   nextArrow: popupNext
   }).on("beforeChange", function (event, slick, currentSlide, nextSlide) {
		var nextSlideNumber = nextSlide + 1;
		var nextSlideDisplay = nextSlideNumber.toString().padStart(2, '0');
		$('.popupZone .page strong').text(nextSlideDisplay);
	});
   $('.popupZone .nss_pg a').click(function(e){
	   slickControl($(this), '#popupSlide', popupStop, popupPlay);
	   e.preventDefault();
   });

   // gallery_slider
	var galleryPrev = '.galleryZone .prev';
	var galleryNext = '.galleryZone .next';
	var galleryStop = '.galleryZone .stop';
	var galleryPlay = '.galleryZone .play';
	$("#gallerySlide").slick({
		slider: '.item',
		infinite: true,
		autoplay: false,
		slidesToShow : 3,
		speed : 500, 
		prevArrow: galleryPrev,
		nextArrow: galleryNext,
		responsive: [
			{ breakpoint: 1240, settings: { slidesToShow:2 }},
			{ breakpoint: 480, settings: { slidesToShow: 1 }}
		]
	});
	$('.galleryZone .nss_pg a').click(function(e){
		slickControl($(this), '#gallerySlide', galleryStop, galleryPlay);
		e.preventDefault();
	});

   //banner
   var bnPrev = '.banner_zone .prev';
   var bnNext = '.banner_zone .next';
   var bnStop = '.banner_zone .stop';
   var bnPlay = '.banner_zone .play';
   $("#bnSlider").slick({
	   slider: '.item',
	   infinite: true,
	   autoplay: true,
	   prevArrow: bnPrev,
	   nextArrow: bnNext,
	   slidesToShow: 5,
	   responsive: [
		   { breakpoint: 1024, settings: { slidesToShow: 4 }},
		   { breakpoint: 768, settings: { slidesToShow: 3 }},
		   { breakpoint: 560, settings: { slidesToShow: 2 }},
		   { breakpoint: 420, settings: { slidesToShow: 1 }}
		 ]
   });
   $('.banner_zone .btn a').click(function(e){
	   slickControl($(this), '#bnSlider', bnStop, bnPlay);
	   e.preventDefault();
   });

});

// slider Control
function slickControl($this, slick, stop, play){
   var $slick = $(slick); //slider wrap
   var $stop = $(stop); //Stop Button
   var $play = $(play); //Play Button
   var display = $this.css("display"); // button's display

   if($this.is(stop)){
	   $stop.css('display','none');
	   $play.delay(100).css('display', display);
	   $slick.slick('slickPause');
   }
   if($this.is(play)){
	   $play.css('display','none');
	   $stop.delay(100).css('display', display);
	   $slick.slick('slickPlay');
   }
}