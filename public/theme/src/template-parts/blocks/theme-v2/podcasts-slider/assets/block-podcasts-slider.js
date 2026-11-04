(function($){

    /**
     * initializeBlock
     *
     * Adds custom JavaScript to the block HTML.
     *
     * @date    29/02/24
     * @since   1.0.0
     *
     * @param   object $block The block jQuery element.
     * @param   object attributes The block attributes (only available when editing).
     * @return  void
     */
    var initializeBlock = function( $block ) {
        var podcastsSlider = $($block).find('.podcasts-slider');

        if( podcastsSlider.length ) {
            /* FILTERS */
            var areaButtons = $($block).find('.parent-areas .podcast-area');
            var activeAreaId = $($block).find('.parent-areas .podcast-area.active').attr('data-area-id');

            var placeholderNoSlides = $($block).find('.no-slides');

            var options = {
                touchThreshold: 20,
                slidesToShow: 1,
                centerMode: true,
                centerPadding: '0',
                prevArrow: '<button type="button" class="primary-btn rtl slider-prev font-inter size-12 semibold uppercase"><div class="content-wrap"><div class="arrow-wrap arrow-1"><svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.1015 6.53033C23.3944 6.23744 23.3944 5.76256 23.1015 5.46967L18.3286 0.696699C18.0357 0.403806 17.5608 0.403806 17.2679 0.696699C16.975 0.989593 16.975 1.46447 17.2679 1.75736L21.5105 6L17.2679 10.2426C16.975 10.5355 16.975 11.0104 17.2679 11.3033C17.5608 11.5962 18.0357 11.5962 18.3286 11.3033L23.1015 6.53033ZM0.428833 6.75H22.5712V5.25H0.428833V6.75Z"></path></svg></div><span>Previous episode</span><div class="arrow-wrap arrow-2"><svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.1015 6.53033C23.3944 6.23744 23.3944 5.76256 23.1015 5.46967L18.3286 0.696699C18.0357 0.403806 17.5608 0.403806 17.2679 0.696699C16.975 0.989593 16.975 1.46447 17.2679 1.75736L21.5105 6L17.2679 10.2426C16.975 10.5355 16.975 11.0104 17.2679 11.3033C17.5608 11.5962 18.0357 11.5962 18.3286 11.3033L23.1015 6.53033ZM0.428833 6.75H22.5712V5.25H0.428833V6.75Z"></path></svg></div></div></button>',
                nextArrow: '<button type="button" class="primary-btn slider-next font-inter size-12 semibold uppercase"><div class="content-wrap"><div class="arrow-wrap arrow-1"><svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.1015 6.53033C23.3944 6.23744 23.3944 5.76256 23.1015 5.46967L18.3286 0.696699C18.0357 0.403806 17.5608 0.403806 17.2679 0.696699C16.975 0.989593 16.975 1.46447 17.2679 1.75736L21.5105 6L17.2679 10.2426C16.975 10.5355 16.975 11.0104 17.2679 11.3033C17.5608 11.5962 18.0357 11.5962 18.3286 11.3033L23.1015 6.53033ZM0.428833 6.75H22.5712V5.25H0.428833V6.75Z"></path></svg></div><span>Next episode</span><div class="arrow-wrap arrow-2"><svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.1015 6.53033C23.3944 6.23744 23.3944 5.76256 23.1015 5.46967L18.3286 0.696699C18.0357 0.403806 17.5608 0.403806 17.2679 0.696699C16.975 0.989593 16.975 1.46447 17.2679 1.75736L21.5105 6L17.2679 10.2426C16.975 10.5355 16.975 11.0104 17.2679 11.3033C17.5608 11.5962 18.0357 11.5962 18.3286 11.3033L23.1015 6.53033ZM0.428833 6.75H22.5712V5.25H0.428833V6.75Z"></path></svg></div></div></button>',
            };

            /* SLIDER */
            var slickSlider = $(podcastsSlider).slick(options);

            if( activeAreaId ) {
                filterSlides(activeAreaId);
                // slickSlider.slick('slickFilter', '.' + activeAreaId);
                
                // // Get the number of filtered slides
                // var numberOfSlides = slickSlider.find('.slick-slide:not(.slick-cloned)').length;

                // if( numberOfSlides < 1 ) {
                //     placeholderNoSlides.addClass('active');
                // } else {
                //     placeholderNoSlides.removeClass('active');
                // }

                // $(slickSlider).find('.slick-slide').attr('tabindex', '-1');
                // $(slickSlider).find('.slick-active').attr('tabindex', '0');
            }
    
            $(areaButtons).each(function(index, areaBtn) {
                var areaId = $(areaBtn).attr('data-area-id');
                var areaTopicsElement = $($block).find('.children-areas[data-area-id="' + areaId + '"]'); // corresponding topics element
    
                var topicCheckboxItem = $(areaTopicsElement).find('.topic-item');
    
                var resetBtn = $(areaTopicsElement).find('.reset-filters');
                validateResetBtnState();
    
                /* APPLY FILTER BY CLICKING AREA BUTTON */
                $(areaBtn).on('click', function() {
                    if( !$(this).hasClass('active') ) {
                        $(areaButtons).removeClass('active');
                        $(this).addClass('active');
        
                        $($block).find('.children-areas').removeClass('active');
                        $(areaTopicsElement).addClass('active');

                        filterSlides(areaId);

                        // animate blue line for slides that werent created on page load - other categories
                        $(podcastsSlider).find('.slick-slide:not(.slick-cloned) .podcast-contributors .accent-line').addClass('active'); 
                    }
                });
    
                /* APPLY FILTER BY CLICKING TOPIC CHECKBOX */
                if( areaTopicsElement.length ) {
                    $(topicCheckboxItem).on('click', function() {
                        $(this).toggleClass('active');
                        $(areaTopicsElement).find('.topic-text-item[data-topic-id="' + $(this).attr('data-topic-id') + '"]').toggleClass('active');

                        validateResetBtnState();
                        filterSlides(areaId);
                    });
                }
    
                /* RESET FILTERS (TO ALL ACTIVE) */
                $(resetBtn).on('click', function() {
                    $(topicCheckboxItem).addClass('active');
                    $(areaTopicsElement).find('.topic-text-item').addClass('active');
                    $(this).removeClass('active');
    
                    validateResetBtnState();
                    filterSlides(areaId);
                });

                /* OPEN/CLOSE FILTERS BOX */
                $(areaTopicsElement).find('.switch-filters').on('click', function() {
                    $(areaTopicsElement).find('.topics-filters').toggleClass('active');
                    $('body').toggleClass('overlay-open');
                });
    
                function validateResetBtnState() {
                    var btnInactive = true;
    
                    topicCheckboxItem.each(function() {
                        if( !$(this).hasClass('active') ) {
                            resetBtn.addClass('active');
                            btnInactive = false;
                            return false;
                        }
                    });
    
                    if(btnInactive) {
                        resetBtn.removeClass('active');
                    }
                }
            });

            function getFiltersSelector(currentAreaId) {
                var activeFilters = '.' + currentAreaId;
                var activeTopics = [];
                var inactiveTopics = [];

                var topicsCheckboxes = $($block).find('.children-areas[data-area-id="' + currentAreaId + '"] .topic-item'); // corresponding topics element

                $(topicsCheckboxes).map(function(){
                    if( $(this).hasClass('active')) {
                        activeTopics.push('.' + $(this).attr('data-topic-id'));
                    } else {
                        inactiveTopics.push(':not(.' + $(this).attr('data-topic-id') + ')');
                    }
     
                });

                if( activeTopics.length ) {
                    activeFilters += activeTopics.join(',');
                } else {
                    activeFilters += inactiveTopics.join('');
                }

                return activeFilters;
            }

            function filterSlides(currentAreaId) {
                var filterClass = getFiltersSelector(currentAreaId);

                slickSlider.slick('slickUnfilter');
                slickSlider.slick('slickFilter', filterClass);

                // Get the number of filtered slides
                var numberOfSlides = slickSlider.find('.slick-slide:not(.slick-cloned)').length;

                if( numberOfSlides < 1 ) {
                    placeholderNoSlides.addClass('active');
                } else {
                    placeholderNoSlides.removeClass('active');
                }

                $(slickSlider).find('.slick-slide').attr('tabindex', '-1');
                $(slickSlider).find('.slick-active').attr('tabindex', '0');
            
                activeAreaId = currentAreaId;
            }

            $('.filters-overlay').on('click', function() {
                $('.topics-filters').removeClass('active');
                $('body').removeClass('overlay-open');
            });
        }

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
        $('.block-podcasts-slider').each(function(){
            initializeBlock( $(this) );
        });
    });

    // Initialize dynamic block preview (editor).
    if( window.acf ) {
        window.acf.addAction( 'render_block_preview/type=block_podcasts_slider', initializeBlock );
    }

})(jQuery);
