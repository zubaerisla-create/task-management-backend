import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { DashboardController } from "./dashboard.controller";

const router = express.Router();

router.get(
  "/insights",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  DashboardController.getDashboardInsights
);

export const DashboardRoutes = router;
