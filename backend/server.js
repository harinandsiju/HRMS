require("dotenv").config();

const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(
                `🚀 Server is running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "❌ Server startup failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();