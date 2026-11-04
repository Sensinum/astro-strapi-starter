(function($){

    /**
     * initializeBlock
     *
     * Adds custom JavaScript to the block HTML.
     *
     * @date    03/07/23
     * @since   1.0.0
     *
     * @param   object $block The block jQuery element.
     * @param   object attributes The block attributes (only available when editing).
     * @return  void
     */
    var initializeBlock = function( $block ) {
        /*
         *  Dropdown toggler add class to parent
         */
        $('.dropdown-button .dropdown-toggle').on('click', function( ){
            $(this).parent().toggleClass('show');
        });
    }

    // Initialize each block on page load (front end).
    $(document).ready(function(){
        $('.block-faq-accordion').each(function() {
            initializeBlock( $(this) );
        });
    });

    // Initialize dynamic block preview (editor).
    if( window.acf ) {
        window.acf.addAction( 'render_block_preview/type=block_faq_accordion', initializeBlock );
    }

})(jQuery);
