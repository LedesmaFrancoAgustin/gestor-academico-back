import express from "express";
import "dotenv/config";
import cors from "cors";
//import path from "path";

import { __dirname } from "./utils.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import connectMongoDB from "./db/connection-mongo.js";
import managerRouter from './routes/routes.manager.js';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors({
  origin: "*",
  exposedHeaders: ["Authorization", "Content-Disposition"]
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname, "public")));

app.use("/api", managerRouter);
app.use(errorHandler);



connectMongoDB();
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
