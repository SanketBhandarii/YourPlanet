import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routers/User.route.js";
import summaryRouter from "./routers/Summary.route.js";
import connectDb from "./db/connectDb.js";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://yoursplanet.vercel.app'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  connectDb();
  console.log(`Server running on the port : ${PORT}`);
});

app.use("/", router);
app.use("/", summaryRouter);
