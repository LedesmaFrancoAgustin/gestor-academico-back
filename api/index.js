import express from "express";
import "dotenv/config";
import cors from "cors";

import { errorHandler } from "../src/middlewares/errorHandler.js";
import connectMongoDB from "../src/db/connection-mongo.js";
import managerRouter from "../src/routes/routes.manager.js";

const app = express();

/* ======================
   DB (serverless safe)
====================== */
await connectMongoDB();

/* ======================
   Middlewares
====================== */
app.use(cors({
  origin: "*",
  exposedHeaders: ["Authorization", "Content-Disposition"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ======================
   Routes
====================== */
app.use("/api", managerRouter);
app.use(errorHandler);

/* ======================
   EXPORT (CLAVE)
====================== */
export default app;
