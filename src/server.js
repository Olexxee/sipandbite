import express from "express";
import cors from "cors";
import adminRoutes from "./routes/adminRoutes.js";
import menuRouter from "./routes/menuRoutes.js";

const app = express();

const allowedOrigins = [
  "https://new-sipand-bite.vercel.app/",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  "",
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("{*path}", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/api/admin", adminRoutes);
app.use("/api/menu", menuRouter);

export default app;
