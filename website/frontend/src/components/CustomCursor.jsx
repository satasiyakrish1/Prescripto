import { useEffect, useRef } from 'react';
import './CustomCursor.css';

const INTERACTIVE = [
  'a', 'button', 'label', 'select',
  '[role="button"]', '[role="link"]',
  '[data-cursor="pointer"]',
].join(',');

const CustomCursor = () => {
  const cursorRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMove = (e) => {
      // Move cursor
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;

      // Single check per frame — no flicker from bubbling events
      if (e.target?.closest(INTERACTIVE)) {
        cursor.classList.add('cc-hidden');
      } else {
        cursor.classList.remove('cc-hidden');
      }
    };

    const onClick = () => {
      cursor.classList.add('cc-click');
      setTimeout(() => cursor.classList.remove('cc-click'), 250);
    };

    // Hide when mouse leaves the viewport
    const onLeave = () => cursor.classList.add('cc-hidden');
    const onEnter = () => cursor.classList.remove('cc-hidden');

    document.addEventListener('mousemove',  onMove,  { passive: true });
    document.addEventListener('mousedown',  onClick, { passive: true });
    document.addEventListener('mouseleave', onLeave, { passive: true });
    document.addEventListener('mouseenter', onEnter, { passive: true });

    return () => {
      document.removeEventListener('mousemove',  onMove);
      document.removeEventListener('mousedown',  onClick);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
    };
  }, []);

  return (
    <div ref={cursorRef} className="cc-cursor" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="26" viewBox="0 0 22 26" fill="none">
        <path
          d="M1.5 1.5L20.5 10.5L12 13.5L7.5 23.5L1.5 1.5Z"
          fill="#111827"
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default CustomCursor;
