import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = async () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_SECRET_KEY
        });

        // Test the configuration
        await cloudinary.api.ping();
        console.log('✅ Cloudinary Connected');
    } catch (error) {
        if (error.error && error.error.http_code === 401 && error.error.message === 'disabled customer') {
            console.warn('⚠️ Cloudinary Warning: The configured account is disabled. Image uploads will not be available.');
        } else {
            console.warn('⚠️ Cloudinary Connection Error:', error.message || 'Unknown error');
        }
        console.log('ℹ️ Server continuing without Cloudinary storage.');
        // Do not throw error to prevent server crash
    }
}

export { cloudinary };
export default connectCloudinary;