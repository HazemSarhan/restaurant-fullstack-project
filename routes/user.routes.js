import express from "express";
import {
  getAllUsers,
  showMe,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { authenticatedUser } from "../middleware/authentication.js";

const router = express.Router();

router.route("/").get(getAllUsers);
router.route("/me").get([authenticatedUser], showMe);
router
  .route("/:id")
  .get(getUserById)
  .patch([authenticatedUser], updateUser)
  .delete([authenticatedUser], deleteUser);

export default router;
