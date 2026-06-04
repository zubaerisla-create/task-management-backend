import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ProjectController } from "./project.controller";
import { projectValidation } from "./project.validation";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  ProjectController.getAllProjects
);

router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  ProjectController.getProjectById
);

router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validateRequest(projectValidation.createProjectValidationSchema),
  ProjectController.createProject
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validateRequest(projectValidation.updateProjectValidationSchema),
  ProjectController.updateProject
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  ProjectController.deleteProject
);

router.post(
  "/:id/add-member",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validateRequest(projectValidation.manageMemberValidationSchema),
  ProjectController.addMember
);

router.post(
  "/:id/remove-member",
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validateRequest(projectValidation.manageMemberValidationSchema),
  ProjectController.removeMember
);

export const ProjectRoutes = router;
