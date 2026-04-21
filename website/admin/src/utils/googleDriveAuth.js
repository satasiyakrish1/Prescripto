// Google Drive Authentication Utilities

export const initGoogleDriveAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/google-callback`;
    const scope = 'https://www.googleapis.com/auth/drive.file';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=token&` +
        `scope=${encodeURIComponent(scope)}&` +
        `prompt=consent`;
    
    return authUrl;
};

export const openGoogleAuthPopup = () => {
    return new Promise((resolve, reject) => {
        const authUrl = initGoogleDriveAuth();
        const popup = window.open(
            authUrl,
            'Google Drive Authorization',
            'width=600,height=600,left=200,top=100'
        );

        // Listen for messages from the popup
        const messageHandler = (event) => {
            if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                window.removeEventListener('message', messageHandler);
                resolve(event.data.accessToken);
            } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
                window.removeEventListener('message', messageHandler);
                reject(new Error('Google authentication failed'));
            }
        };

        window.addEventListener('message', messageHandler);

        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            window.removeEventListener('message', messageHandler);
            reject(new Error('Popup was blocked. Please allow popups for this site.'));
        }

        // Check if popup was closed manually
        const checkPopupClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkPopupClosed);
                window.removeEventListener('message', messageHandler);
                reject(new Error('Authentication cancelled'));
            }
        }, 1000);
    });
};

export const getStoredAccessToken = () => {
    return localStorage.getItem('googleAccessToken');
};

export const setStoredAccessToken = (token) => {
    localStorage.setItem('googleAccessToken', token);
};

export const removeStoredAccessToken = () => {
    localStorage.removeItem('googleAccessToken');
};

export const isGoogleDriveAuthorized = () => {
    return !!getStoredAccessToken();
};

// Check if token is expired (tokens expire after 1 hour)
export const isTokenExpired = () => {
    const tokenTimestamp = localStorage.getItem('googleTokenTimestamp');
    if (!tokenTimestamp) return true;
    
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    const now = Date.now();
    
    return (now - parseInt(tokenTimestamp)) > oneHour;
};

export const refreshTokenIfNeeded = async () => {
    if (isTokenExpired()) {
        removeStoredAccessToken();
        return false;
    }
    return true;
};
