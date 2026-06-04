import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { TaskController } from "./task.controller";
import { taskValidation } from "./task.validation";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validateRequest(taskValidation.createTaskValidationSchema),
  TaskController.createTask
);

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  TaskController.getAllTasks
);

router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  TaskController.getTaskById
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  validateRequest(taskValidation.updateTaskValidationSchema),
  TaskController.updateTask
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  TaskController.deleteTask
);

export const TaskRoutes = router;
