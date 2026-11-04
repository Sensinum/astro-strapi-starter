jQuery(document).ready(function($) {
	var prevScrollPos = window.scrollY;
	var timeoutId = null;
	
	if( prevScrollPos > 1 ) {
		$('body').addClass('follow-me');
	}
	
	// compress & hide navbar on scroll
	function snap(scroll) {
		var hideMenuOffset = 500;
		
		if( $(window).width() < 991 ) {
			hideMenuOffset = 200;
		}
		
		if( scroll > hideMenuOffset ) {
			if( prevScrollPos > scroll ) {
				$('body').removeClass('hide-nav');
			} else {
				$('body').addClass('hide-nav');
			}
		} else {
			$('body').removeClass('hide-nav');
		}
		
		if( scroll > 1 ) {
			$('body').addClass('follow-me');
			
			prevScrollPos = scroll;
		} else {
			$('body').removeClass('follow-me');
		}
	}
	
	function timeoutFunction() {
		if( timeoutId ) {
			clearTimeout(timeoutId);
		}
		
		timeoutId = setTimeout(snap, 10, window.scrollY);
	}
	
	addEventListener('resize', timeoutFunction, true);
	addEventListener('scroll', timeoutFunction, true);
	
	
	// desktop dropdowns
	$('.nav-main-menu .menu-item-has-children').on('click', function(){
		$(this).toggleClass('opened');
	});
	
	
	// mobile menu toggler
	$('.navigation-menus__mobile-menu').on('click', function(){
		$(this).toggleClass('opened');
		$('.navigation-menus__wrapper').toggleClass('opened');
	});
	
	
	$(window).on('resize', function() {
		$('.nav-main-menu .menu-item-has-children > a').on('click', function(e){
			if( $(window).width() > 991 ) {
				return true;
			} else {
				e.preventDefault();
			}
		});
	}).resize();
	

	/*
	 * Check for smooth scrolling class or hashtags
	 * if there is no target act as normal link
	 */
	$('a[href*="#"]:not([href="#"])').on("click", smoothScroll);

	function smoothScroll(event) {
		var currentlyClicked = $(this);
		var classCheck = ["slider-control"]; // disabled elements - array of classes
		var goThrough = true;
		
		classCheck.forEach(testClass);

		function testClass(classItem) {
			if( currentlyClicked.hasClass(classItem) ) goThrough = false;
		}
		
		if( goThrough ) {
			var target = $("[id=" + this.hash.slice(1) + "]");
	
			if( target.length ) {
				event.preventDefault();

				var scrollDuration = 1000;
				var scrollOffset = target.offset().top;

				if( $(window).width() < 992 ) {
					$('.navigation-menus__mobile-menu').removeClass('opened');
					$('.navigation-menus__wrapper').removeClass('opened');
				}

				if( currentlyClicked.hasClass('caption-less') ) {
					scrollDuration = 200;
					scrollOffset -= 80;
				}

				if( $('body').hasClass('admin-bar') ) {
					scrollOffset -= 40;
				}

		        $('html, body').animate({
					scrollTop: scrollOffset
				}, scrollDuration);
			} else {
				console.log("There is no anchor like that here!");
			}
		}
	}
		
	/*
	 * Check for hashtag in URL to smooth-scroll on load
	 */
	if (window.location.hash) {
		var hash = window.location.hash.slice(1);

		// Use a setTimeout to ensure that the elements have loaded
		setTimeout(function () {
			var target = $("[id=" + hash + "]");
			var scrollOffset = target.offset().top;

			if( $('body').hasClass('admin-bar') ) {
				scrollOffset -= 40;
			}

			if( target.length ) {
				$("html, body").animate({
					scrollTop: scrollOffset,
				}, 1000 );
			} else {
				console.log("There is no anchor like that here!");
			}
		}, 500);
	}
			
	$('.icon-scroll-up').on('click', function() {
		$('html, body').animate({
			scrollTop: 0
		}, 500);
	});
});
		