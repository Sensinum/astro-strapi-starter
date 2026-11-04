(function($){

    /**
     * initializeBlock
     *
     * Adds custom JavaScript to the block HTML.
     *
     * @date    07/09/23
     * @since   1.0.0
     *
     * @param   object $block The block jQuery element.
     * @param   object attributes The block attributes (only available when editing).
     * @return  void
     */
    var initializeBlock = function( $block ) {
        var slider = $block.find('.splide');

        if( slider.length ) {
            var sliderId = slider[0]['id'];

            var splide = new Splide( '#' + sliderId, {
                autoWidth: true,
                direction: 'rtl',
                gap: '40px',
                trimSpace: false,
                speed: 500,
                easing: 'ease',
                arrows: false,
                pagination: false,
                breakpoints: {
                    991: {
                        focus: 'center',
                        gap: '30px',
                    },
                    576: {
                        gap: '20px',
                    },
                }
            } );
            
            splide.mount();
        }

        var animationPerformed = false;

        $(window).on("scroll resize", function() {
            if($block.visible(true) && !animationPerformed) {
                $block.find('.accent-line').addClass('active');
                animationPerformed = true;
            }
        });


        var slidesWithDesc = $(slider).find('.slide-has-desc');
        var baseDesc = $($block).find('.base-desc');

        if(slidesWithDesc) {
            $(slidesWithDesc).hover(function() {
                var targetId = $(this).attr('data-target-id');
                $('#' + targetId).show();

                $(baseDesc).hide();
            }, function() {
                var targetId = $(this).attr('data-target-id');
                $('#' + targetId).hide();

                $(baseDesc).show();
            });
        }
    }

    // Initialize each block on page load (front end).
    $(document).ready(function(){
        $('.block-slider-half-screen').each(function(){
            initializeBlock( $(this) );
        });
    });

    // Initialize dynamic block preview (editor).
    if( window.acf ) {
        window.acf.addAction( 'render_block_preview/type=block_slider_half_screen', initializeBlock );
    }

})(jQuery);
