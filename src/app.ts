import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import router from "./app/routes";
import { seedAdmin } from "./app/utils/seedAdmin";

const app: Application = express();

// app.use(cors({
//     origin: ["http://localhost:3000", "http://localhost:5173"],
//     credentials: true,
// }));

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());





app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Welcome to sptc-system-backend API",
    });
});

app.set("trust proxy", 1);

app.use("/api/v1", router);

// Seed default users (admin, pm, member) if they don't exist
seedAdmin().catch((err) => {
  console.error("Error seeding default users:", err);
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
