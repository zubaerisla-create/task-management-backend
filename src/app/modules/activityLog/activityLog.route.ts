import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { ActivityLogController } from "./activityLog.controller";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  ActivityLogController.getLogs
);

export const ActivityLogRoutes = router;
