import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js';

dotenv.config();

const migrateSettings = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update all users with new settings fields
        const result = await userModel.updateMany(
            {},
            {
                $set: {
                    'connectedAccounts.google': false,
                    'notificationSettings.dnd': false,
                    'profileVisibility': 'public',
                    'betaFeaturesEnabled': false,
                    'preferences.language': 'en',
                    'preferences.timezone': 'UTC',
                    'preferences.dateFormat': 'MM/DD/YYYY',
                    'preferences.timeFormat': '12h',
                    'twoFactorAuth.enabled': false
                }
            }
        );

        console.log(`Migration completed: ${result.modifiedCount} users updated`);

        // Update Google users to have connected accounts set
        const googleUsersResult = await userModel.updateMany(
            { isGoogleUser: true },
            {
                $set: {
                    'connectedAccounts.google': true,
                    'connectedAccounts.googleEmail': '$email'
                }
            }
        );

        console.log(`Google users updated: ${googleUsersResult.modifiedCount} users`);

        await mongoose.disconnect();
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateSettings();
