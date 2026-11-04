(function($){

    /**
     * initializeBlock
     *
     * Adds custom JavaScript to the block HTML.
     *
     * @date    15/4/19
     * @since   1.0.0
     *
     * @param   object $block The block jQuery element.
     * @param   object attributes The block attributes (only available when editing).
     * @return  void
     */
    var initializeBlock = function( $block ) {
        
        var headerSlider = $block[0].children[0];

        if( $(headerSlider).hasClass('header-slider') && $(headerSlider).find('.carousel-item').length ) {

            $(headerSlider).carousel({
                ride: 'carousel',
                interval: 7500,
            });

            function changeControlsColors(element) {

                if( element.type == 'slide' ) {
                    var slider = element['currentTarget'];
                    var slideContent = element.relatedTarget.children['0'];
                } else {
                    var slider = element['0']
                    var slideContent = $(element).find('.carousel-item.active')['0'].children['0'];
                }

                var fontClass = 'light-font';
                if( slideContent.classList.contains('dark-font') ) {
                    fontClass = 'dark-font';
                }

                var slideBgColor = $(slideContent).css('background-color');
                
                var controls = $(slider).find('.slider-controls');

                $(controls).find(">:first-child").removeClass().addClass(fontClass);
                $(controls).find('i').css( 'color', slideBgColor );
                $(controls).find('svg').css( 'color', slideBgColor );

                $(controls).css('opacity', '1');
            }

            changeControlsColors($(headerSlider));

            $(headerSlider).on('slide.bs.carousel', function(e) {
                changeControlsColors(e);
            });

            function calculateSlidesHeight() {
                window.heights = [], //create empty array to store height values
                window.tallest; //create variable to make note of the tallest slide
                
                function normalizeHeights() {
                    $(headerSlider).find('.carousel-item').each(function() { //add heights to array
                        window.heights.push($(this).outerHeight());
                    });
                    window.tallest = Math.max.apply(null, window.heights); //cache largest value
                    $(headerSlider).find('.carousel-item').each(function() {
                        $(this).css('height',tallest + 'px');
                    });
                }
                normalizeHeights();
        
                $(window).on('resize orientationchange', function () {
                    
                    window.tallest = 0, window.heights.length = 0; //reset vars
                    $(headerSlider).find('.carousel-item').each(function() {
                        $(this).css('height',''); //reset height
                    }); 
                    
                    normalizeHeights(); //run it again 
        
                });
            }

            calculateSlidesHeight();

        }

    }

    // Initialize each block on page load (front end).
    $(document).ready(function(){
        $('.block-header-home').each(function(){
            initializeBlock( $(this) );
        });
    });

    // Initialize dynamic block preview (editor).
    if( window.acf ) {
        window.acf.addAction( 'render_block_preview/type=block_header_home', initializeBlock );
    }

})(jQuery);
