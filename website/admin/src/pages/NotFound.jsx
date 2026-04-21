import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import lottie from 'lottie-web';

const NotFound = () => {
  const animationContainer = useRef(null);
  const [animationError, setAnimationError] = useState(false);
  
  useEffect(() => {
    if (!animationContainer.current) return;
    
    let anim = null;
    
    try {
      // Load and initialize the Lottie animation
      anim = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        // Using a common, reliable 404 animation
        path: 'https://lottie.host/051222b7-f29f-445b-9cac-7e40b25e7763/75BPmJxzDV.lottie',
      });
      
      // Event listeners to handle loading issues
      anim.addEventListener('data_ready', () => {
        console.log('Lottie data loaded successfully');
      });
      
      anim.addEventListener('data_failed', () => {
        console.error('Lottie data failed to load');
        setAnimationError(true);
      });
      
    } catch (error) {
      console.error('Error initializing Lottie animation:', error);
      setAnimationError(true);
    }
    
    // Clean up animation on component unmount
    return () => {
      if (anim) {
        anim.destroy();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Lottie animation container with specific dimensions */}
        <div 
          ref={animationContainer} 
          className={`mx-auto ${animationError ? 'hidden' : 'block'}`}
          style={{ height: '300px', width: '300px' }}
        ></div>
        
        {/* Fallback if animation fails to load */}
        {animationError && (
          <div className="text-center mb-8">
            <span className="text-6xl">🔍</span>
          </div>
        )}
        
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">Page Not Found</h2>
        
        <p className="text-center text-gray-600 mb-8">
          The page you're looking for doesn't exist or you don't have permission to access it.
        </p>
        
        <div className="flex justify-center">
          <Link 
            to="/dashboard" 
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;