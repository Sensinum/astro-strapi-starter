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
        var videoId = $block.find('#' + $block[0]['id'] + '-video-wrapper').attr('data-video-id');
        var ctaBtn = $block.find('.primary-btn');

        if( videoId ) {
            var options = {
                id: videoId,
                loop: true,
                autoplay: true,
                autopause: false,
                muted: true,
                controls: false,
            };

            var videoWrapper = $block.find('.main-col');
            var placeholder = videoWrapper.find('.video-placeholder');
            var player;

            player = new Vimeo.Player($block[0]['id'] + '-video-wrapper', options);

            player.on('loaded', function () {
                $(placeholder).hide();
            });

            if( ctaBtn.length ) {
                $(ctaBtn).hover(
                    function() {
                        player.pause();
                    }, function() {
                        player.play();
                    }
                );
            }
        }

        var animationPerformed = false;

        $(window).on("scroll resize", function() {
            if($block.visible(true) && !animationPerformed) {
                $block.find('.accent-line').addClass('active');
                animationPerformed = true;
            }
        }).scroll();
    }

    // Initialize each block on page load (front end).
    $(document).ready(function(){
        $('.block-header-podcast').each(function(){
            initializeBlock( $(this) );
        });
    });

    // Initialize dynamic block preview (editor).
    if( window.acf ) {
        window.acf.addAction( 'render_block_preview/type=block_header_podcast', initializeBlock );
    }

})(jQuery);
