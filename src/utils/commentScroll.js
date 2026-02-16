// commentScroll.js
// Utility function to scroll to a specific comment from notification

export function scrollToComment(commentId, delay = 500, maxRetries = 5) {
  console.log('🎯 Attempting to scroll to comment:', commentId, 'with delay:', delay);
  console.log('🖥️  Screen width:', window.innerWidth, 'px');
  
  let retryCount = 0;
  
  const attemptScroll = () => {
    // Find ALL elements with this ID (there may be duplicates for mobile/desktop)
    const allElements = document.querySelectorAll(`#comment-${commentId}`);
    console.log(`🔍 Found ${allElements.length} elements with ID: comment-${commentId}`);
    
    // Filter to find only the VISIBLE one
    let commentElement = null;
    let visibleCount = 0;
    
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      
      // Check if element is visible (not display:none or visibility:hidden)
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      // More comprehensive visibility check
      const isVisible = style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0' &&
                       el.offsetParent !== null && // offsetParent is null for hidden elements
                       rect.width > 0 && 
                       rect.height > 0;
      
      console.log(`  Element ${i + 1}:`, {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        offsetParent: el.offsetParent ? 'exists' : 'null',
        width: rect.width,
        height: rect.height,
        isVisible: isVisible
      });
      
      if (isVisible) {
        commentElement = el;
        visibleCount++;
        console.log(`👁️  Element ${i + 1} is VISIBLE! Using this one.`);
        break;
      } else {
        console.log(`🙈 Element ${i + 1} is HIDDEN, skipping...`);
      }
    }
    
    if (visibleCount === 0 && allElements.length > 0) {
      console.warn('⚠️  Found elements but NONE are visible!');
    }
    
    if (commentElement) {
      console.log('✅ Comment found! Scrolling...');
      
      // Calculate position to scroll to (with offset for header)
      const elementPosition = commentElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset from top
      
      console.log('📏 Scroll calculation:', {
        elementTop: elementPosition,
        currentScroll: window.pageYOffset,
        targetScroll: offsetPosition
      });
      
      // Smooth scroll to the comment
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Wait a bit for scroll to complete, then highlight
      setTimeout(() => {
        // Highlight the comment
        commentElement.classList.add('highlight-comment');
        
        // Also add a pulsing effect for better visibility
        commentElement.style.transition = 'all 0.3s ease';
        commentElement.style.transform = 'scale(1.02)';
        
        setTimeout(() => {
          commentElement.style.transform = 'scale(1)';
        }, 300);
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          commentElement.classList.remove('highlight-comment');
        }, 3000);
        
        console.log('🎨 Comment highlighted!');
      }, 800); // Wait 800ms for scroll animation to complete
      
      return true; // Success!
      
    } else {
      console.warn(`⚠️  Comment element not found or not visible (attempt ${retryCount + 1}/${maxRetries}):`, `comment-${commentId}`);
      
      // Retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`🔄 Retrying in 1 second... (${retryCount}/${maxRetries})`);
        setTimeout(attemptScroll, 1000); // Retry after 1 second
      } else {
        console.error(`❌ Comment not found after ${maxRetries} attempts. Giving up.`);
        
        // Try to scroll to comments section at least
        const commentsSection = document.querySelector('[class*="comment"]');
        if (commentsSection) {
          console.log('📍 Scrolling to comments section instead');
          commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        return false;
      }
    }
  };
  
  // Start the first attempt after initial delay
  setTimeout(attemptScroll, delay);
}

