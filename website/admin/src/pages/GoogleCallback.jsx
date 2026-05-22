import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Extract access token from URL hash
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');

        if (accessToken) {
            // Store access token in localStorage
            localStorage.setItem('googleAccessToken', accessToken);
            
            // Close the popup window if opened in popup
            if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', accessToken }, '*');
                window.close();
            } else {
                // Redirect back to the previous page
                navigate(-1);
            }
        } else {
            console.error('No access token found in URL');
            if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR' }, '*');
                window.close();
            } else {
                navigate('/');
            }
        }
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Connecting to Google Drive...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
