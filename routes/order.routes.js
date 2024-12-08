import express from "express";
import {
  addToCart,
  getCartItems,
  checkout,
  checkOutWithStripe,
  clearCart,
  handleSuccess,
  getAllOrders,
} from "../controllers/order.controller.js";
import {
  authenticatedUser,
  authorizePermissions,
} from "../middleware/authentication.js";

const router = express.Router();

router.route("/").get([authenticatedUser], getAllOrders);
router
  .route("/cart")
  .post([authenticatedUser], addToCart)
  .get([authenticatedUser], getCartItems);
router.route("/checkout").post([authenticatedUser], checkout);
router.post("/stripe", [authenticatedUser], checkOutWithStripe);
router.route("/success").get([authenticatedUser], handleSuccess);
router.route("/clear").delete([authenticatedUser], clearCart);

export default router;
