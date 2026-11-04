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
        
        var elms = document.getElementsByClassName( 'splide-videos' );
        var sliders = [];

        for ( var i = 0, len = elms.length; i < len; i++ ) {

            sliders[ i ] = new Splide( elms[ i ], {
                autoplay: false,
                perPage: 4,
                gap: '20px',
                // pagination: false,
                lazyLoaf: 'sequential',
                //arrows: false,
                breakpoints: {
                    1439: {
                        perPage: 3,
                    },
                    991: {
                        perPage: 2,
                        drag: true,
                    },
                    575: {
                        perPage: 1,
                        drag: true,
                    },
                }
            }).mount();

        }   
    }

    // Initialize each block on page load (front end).
    $(document).ready(function(){
        $('.block-videos').each(function(){
            initializeBlock( $(this) );
        });
    });

    // Initialize dynamic block preview (editor).
    if( window.acf ) {
        window.acf.addAction( 'render_block_preview/type=block_videos_home', initializeBlock );
    }

})(jQuery);
