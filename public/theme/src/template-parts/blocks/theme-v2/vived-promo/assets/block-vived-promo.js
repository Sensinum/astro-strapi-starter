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
        var videoWrapper = $block.find('.video-wrapper');

        if( videoWrapper.length ) {
            var iframeWrapper = $block.find('#' + $block[0]['id'] + '-video-wrapper');

            if( iframeWrapper.length ) {
                var placeholder = videoWrapper.find('.video-placeholder');
                var videoId = iframeWrapper.attr('data-video-id');

                if( videoId ) {
                    var options = {
                        id: videoId,
                        loop: true,
                        autoplay: true,
                        autopause: false,
                        muted: true,
                        controls: false,
                    };
        
                    var player;
        
                    $( window ).on("scroll resize", function() {
                        if( $(videoWrapper).visible(true) && !player ) {
                            player = new Vimeo.Player($block[0]['id'] + '-video-wrapper', options);
        
                            player.on('loaded', function () {
                                $(placeholder).hide();
                            });
                        }
                    }).scroll();
                }
            }
        }

        var linkContainer = $block.find('.link-vived');

        if( linkContainer.length ) {
            if (navigator.userAgent.match(/Android/i)) {
                $(linkContainer).addClass('android');
            } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
                $(linkContainer).addClass('ios');
            }
        }
    }

    // Initialize each block on page load (front end).
    $(document).ready(function(){
        $('.block-vived-promo').each(function(){
            initializeBlock( $(this) );
        });
    });

    // Initialize dynamic block preview (editor).
    if( window.acf ) {
        window.acf.addAction( 'render_block_preview/type=block_vived_promo', initializeBlock );
    }

})(jQuery);
