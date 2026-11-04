(function($){

    /**
     * initializeBlock
     *
     * Adds custom JavaScript to the block HTML.
     *
     * @date    08/09/23
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
        $('.block-accent-line-separator').each(function(){
            initializeBlock( $(this) );
        });
    });

    // Initialize dynamic block preview (editor).
    if( window.acf ) {
        window.acf.addAction( 'render_block_preview/type=block_green_line_separator', initializeBlock );
    }

})(jQuery);
