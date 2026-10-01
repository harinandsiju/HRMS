const mongoose = require("mongoose");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            process.env.MONGODB_URI,
            {
                serverSelectionTimeoutMS: 15000
            }
        );

        console.log(
            `✅ MongoDB Connected: ${connection.connection.host}`
        );
    } catch (error) {
        console.error("❌ MongoDB Connection Failed");
        console.error(error.message);

        throw error;
    }
};

module.exports = connectDB;