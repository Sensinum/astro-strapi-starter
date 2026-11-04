(function($){

    /**
     * initializeBlock
     *
     * Adds custom JavaScript to the block HTML.
     *
     * @date    01/08/22
     * @since   1.0.0
     *
     * @param   object $block The block jQuery element.
     * @param   object attributes The block attributes (only available when editing).
     * @return  void
     */
    var initializeBlock = function( $block ) {
        // change sticky bar (.item-day-label) appearance, when it's actually sticking

        // Declare what to observe - helper html el
        var agendaDayLabels = $($block).find('.agenda-item .item-day-label-helper');

        if( agendaDayLabels.length ) {
            $('.container-panoramic-fhd').css('overflow', 'initial'); // position: sticky; doesn't work with overflow hidden on any upper element

            // Register IntersectionObserver
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    // Add 'is-sticky' class if observation target is inside viewport
                    if (entry.intersectionRatio === 0) {
                        entry.target.nextElementSibling.classList.add('is-sticky');
                    }

                    // Remove 'is-sticky' class otherwise
                    else if(entry.intersectionRatio === 1) {
                        entry.target.nextElementSibling.classList.remove('is-sticky');
                    }
                });
            });

            $( window ).on("resize", function() {
                if( $(window).width() < 991 ) {
                    // Observe target elements
                    agendaDayLabels.each(function(i, el) {
                        io.observe($(el).get(0));
                    })
                } else { // no need for sticky bars on desktop
                    // Stop watching all of target elements for visibility changes
                    io.disconnect();

                    agendaDayLabels.each((i, label) => {
                        $(label).next().removeClass('is-sticky');
                    });
                }
            }).resize();
        }
    }

    // Initialize each block on page load (front end).
    $(document).ready(function(){
        $('.block-conf-2022-agenda').each(function(){
            initializeBlock( $(this) );
        });
    });

    // Initialize dynamic block preview (editor).
    if( window.acf ) {
        window.acf.addAction( 'render_block_preview/type=block_conf_2022_agenda', initializeBlock );
    }

})(jQuery);
