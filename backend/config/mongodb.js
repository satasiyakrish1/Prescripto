import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const options = {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 75000,
            connectTimeoutMS: 30000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
            maxPoolSize: 10,
            minPoolSize: 5
        };

        mongoose.connection.on('connected', () => console.log("✅ Database Connected"));
        mongoose.connection.on('error', (err) => console.error('❌ MongoDB connection error:', err));
        mongoose.connection.on('disconnected', () => console.log('⚠️ MongoDB disconnected'));

        // Ensure the connection string is properly formatted and includes database name
        let mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error("MONGODB_URI is not defined in environment variables.");
        }

        // Append database name if not present
        if (!mongoURI.includes('?')) {
            mongoURI = `${mongoURI}/prescripto?retryWrites=true&w=majority`;
        } else if (!mongoURI.includes('/')) {
            mongoURI = mongoURI.replace('?', '/prescripto?');
        }

        // Connect to MongoDB with the database name included in the URI
        await mongoose.connect(mongoURI, options);
        
        console.log('✅ Connected to database:', mongoose.connection.name);
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB;
