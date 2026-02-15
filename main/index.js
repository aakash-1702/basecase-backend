import express from "express";
const app = express();
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "../routes/user.routes.js";
import cookieParser from "cookie-parser";
import adminRouter from "../routes/admin.routes.js";
dotenv.config({
  path: "./.env", // Changed from "./src/.env"
});
app.use(
  cors({
    origin: ["https://basecase-weld.vercel.app", "http://localhost:3000"], // your frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const PORT = process.env.PORT || 5000;
console.log(process.env.PORT);

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`Server started at PORT ${PORT}`);
});
