import { Router } from "express";
import multer from "multer";
import {
  updateProfile,
  updateStatus,
  userLogin,
  userLogout,
  userSignup,
  verifyPassword,
  verifyUser,
} from "../controllers/user-controllers.js";
import { verifyToken } from "../utils/token-manager.js";
import {
  loginValidator,
  signupValidator,
  validate,
} from "../utils/validators.js";

const userRoutes = Router();

const upload = multer({ dest: "uploads/" });


// signup
userRoutes.post("/signup", validate(signupValidator), userSignup);

// login
userRoutes.post("/login", validate(loginValidator), userLogin);

// auth-status
userRoutes.get("/auth-status", verifyToken, verifyUser);

// logout
userRoutes.get("/logout", verifyToken, userLogout);

// Profile update
userRoutes.put("/updateprofile", verifyToken, upload.single("profile"), updateProfile);

// Update status
userRoutes.put("/update-status", verifyToken, updateStatus);

// Verify password
userRoutes.post("/verify-password", verifyToken, verifyPassword);

export default userRoutes;
