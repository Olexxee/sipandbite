import dotenv from "dotenv";

dotenv.config();

import app from "./src/server.js";
import prisma from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("✅ Database connected successfully");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down...`);

      server.close(async () => {
        try {
          await prisma.$disconnect();
          console.log("✅ Database disconnected");
          process.exit(0);
        } catch (error) {
          console.error("❌ Database disconnect failed:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Database connection failed:", error);

    await prisma.$disconnect();

    process.exit(1);
  }
}

startServer();
