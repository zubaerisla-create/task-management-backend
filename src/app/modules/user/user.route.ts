import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { userValidation } from "./user.validation";

const router = express.Router();

// Existing routes
router.post(
    "/",
    validateRequest(userValidation.createUserValidationSchema),
    UserController.createUser
);

import { fileUpload } from "../../utils/fileUpload";

router.patch(
    "/update-profile",
    auth(UserRole.TEAM_MEMBER, UserRole.PROJECT_MANAGER, UserRole.ADMIN),
    fileUpload.upload.single("file"),
    validateRequest(userValidation.updateUserValidationSchema),
    UserController.userUpdateProfile
);

// Get current user (protected)
router.get("/me", auth(UserRole.TEAM_MEMBER, UserRole.PROJECT_MANAGER, UserRole.ADMIN), UserController.getSingleUser);

// FIND USER BY ID (protected)
router.get("/:id", auth(UserRole.ADMIN, UserRole.TEAM_MEMBER, UserRole.PROJECT_MANAGER), UserController.getFindUserById);

// GET ALL USERS (protected)
router.get("/", auth(UserRole.ADMIN, UserRole.TEAM_MEMBER, UserRole.PROJECT_MANAGER), UserController.getAllUsers);

// DELETE USER BY ID (protected)
router.delete("/:id", auth(UserRole.ADMIN), UserController.deleteUser);

// Change user role (Admin only)
router.patch(
    "/role/:id",
    auth(UserRole.ADMIN),
    validateRequest(userValidation.changeRoleValidationSchema),
    UserController.changeUserRole
);

export const UserRoutes = router;
