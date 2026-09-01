import express from "express";
import cors from "cors";

import adminRoutes from "./routes/adminRoutes.js";
import menuRouter from "./routes/menuRoutes.js";

const app = express();

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────

const allowedOrigins = [
  "https://new-sip-and-bite.vercel.app",
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

console.log("Allowed CORS origins:", allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    console.log("Incoming request origin:", origin);

    // Requests without an Origin header
    // are allowed (Postman, server-to-server, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log("CORS allowed:", origin);
      return callback(null, true);
    }

    console.warn("CORS rejected:", origin);

    // IMPORTANT:
    // Do not throw an error here.
    // Simply don't grant CORS access.
    return callback(null, false);
  },

  credentials: true,

  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Sip and Bite API is running",
  });
});

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

app.use("/api/admin", adminRoutes);
app.use("/api/menu", menuRouter);

export default app;

