import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
  getProductById,
} from "../controllers/product.controller.js";

const router = express.Router();

router.route("/").post(createProduct).get(getAllProducts);
router
  .route("/:id")
  .delete(deleteProduct)
  .patch(updateProduct)
  .get(getProductById);

export default router;
