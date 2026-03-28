const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const updateExistingUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Connected to DB. Updating users...');
        const result = await User.updateMany(
            { isVerified: { $exists: false } },
            { $set: { isVerified: true } }
        );

        console.log(`Updated ${result.modifiedCount} users to be verified.`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateExistingUsers();