jQuery(document).ready(function($) {
    var headerImgLines = $('.header-inter .hover-me.with-img');

    if( false ) { //  if( headerImgLines.length ) { // disable till design for img cursor is ready
        // Create the custom cursor element
        var customCursor = $('<div class="custom-cursor"><div class="cursor-img"></div></div>');

        // Append it to the body
        $('body').append(customCursor);

        function handleMouseMove(e) {
            var $this = $(this);
            $this.css('cursor', 'none');
    
            customCursor.css({
                transform: 'translate(' + e.clientX + 'px, ' + e.clientY + 'px)',
                opacity: 1,
                backgroundImage: 'url(' + $this.data('img-src') + ')',
            });
        }
    
        function handleMouseLeave() {
            customCursor.css('opacity', 0);
        }
    
        function checkScreenWidth() {
            // Check if the screen width is greater than 768 pixels
            if ($(window).width() > 768) {
                headerImgLines.on('mousemove', handleMouseMove);
                headerImgLines.on('mouseleave', handleMouseLeave);
            } else {
                // If the screen width is smaller or equal to 768 pixels, remove event handlers
                headerImgLines.off('mousemove', handleMouseMove);
                headerImgLines.off('mouseleave', handleMouseLeave);
                customCursor.css('opacity', 0);
                headerImgLines.css('cursor', 'default');
            }
        }
    
        // Check screen width on page load
        checkScreenWidth();
    
        // Attach event listener to window resize event to adapt to changes
        $(window).on('resize', checkScreenWidth);
    }
});