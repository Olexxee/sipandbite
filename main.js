import dotenv from "dotenv";
dotenv.config();
import app from "./src/server.js";
import prisma from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();

    console.log("✅ Database connected successfully");

    // Start server only after database connection succeeds
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);

    await prisma.$disconnect();

    process.exit(1);
  }
}

startServer();

