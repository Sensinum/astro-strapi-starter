(function($){

    /**
     * initializeBlock
     *
     * Adds custom JavaScript to the block HTML.
     *
     * @date    27/02/24
     * @since   1.0.0
     *
     * @param   object $block The block jQuery element.
     * @param   object attributes The block attributes (only available when editing).
     * @return  void
     */
    var initializeBlock = function( $block ) {
        var animationPerformed = false;

        $(window).on("scroll resize", function() {
            if($block.visible(true) && !animationPerformed) {
                $block.find('.accent-line').addClass('active');
                animationPerformed = true;
            }
        });
    }

    // Initialize each block on page load (front end).
    $(document).ready(function(){
        $('.block-logo-with-text').each(function(){
            initializeBlock( $(this) );
        });
    });

    // Initialize dynamic block preview (editor).
    if( window.acf ) {
        window.acf.addAction( 'render_block_preview/type=block_logo_with_text', initializeBlock );
    }

})(jQuery);
