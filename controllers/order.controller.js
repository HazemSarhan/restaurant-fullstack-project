import { PrismaClient } from "@prisma/client";
let prisma = new PrismaClient();
import { StatusCodes } from "http-status-codes";
import BadRequestError from "../errors/bad-request.js";

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity) {
    throw new BadRequestError("Please provide productId and quantity");
  }
  const userId = req.user.userId;
  const cartItem = await prisma.cart.upsert({
    where: {
      userId_productId: {
        userId,
        productId: parseInt(productId, 10), // Convert productId to integer
      },
    },
    update: {
      quantity: {
        increment: parseInt(quantity, 10), // Convert quantity to integer
      },
    },
    create: {
      userId,
      productId: parseInt(productId, 10), // Convert productId to integer
      quantity: parseInt(quantity, 10), // Convert quantity to integer
    },
  });
  res
    .status(StatusCodes.CREATED)
    .json({ cartItem, msg: "Added to cart successfully" });
};

export const getCartItems = async (req, res) => {
  const userId = req.user.userId;
  const cartItems = await prisma.cart.findMany({
    where: {
      userId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
    },
  });
  const count = cartItems.reduce((total, item) => total + item.quantity, 0);
  res.status(StatusCodes.OK).json({ cartItems, count });
};

export const checkout = async (req, res) => {
  const userId = req.user.userId;
  const cartItems = await prisma.cart.findMany({
    where: {
      userId,
    },
    include: {
      product: true,
    },
  });
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ msg: "Cart is empty" });
  }
  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + item.quantity * item.product.price;
  }, 0);

  const order = await prisma.order.create({
    data: {
      userId,
      orderItems: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalPrice,
      status: "PENDING",
    },
  });

  await prisma.cart.deleteMany({ where: { userId } }); // Clear cart after checkout

  res.status(StatusCodes.CREATED).json({ order });
};

export const checkOutWithStripe = async (req, res) => {
  const userId = req.user.userId;
  const cartItems = await prisma.cart.findMany({
    where: { userId },
    include: { product: true },
  });
  if (!cartItems || cartItems.length === 0) {
    throw new BadRequestError("Cart is empty");
  }
  const lineItems = cartItems.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.product.name,
        images: [item.product.image],
      },
      unit_amount: item.product.price * 100, // Amount in cents
    },
    quantity: item.quantity,
  }));
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `http://localhost:3000/api/v1/orders/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:3000/cart`,
    metadata: {
      userId: userId,
    },
  });
  res.status(StatusCodes.OK).json({ url: session.url });
};

export const clearCart = async (req, res) => {
  const userId = req.user.userId;
  await prisma.cart.deleteMany({ where: { userId } });
  res.status(StatusCodes.OK).json({ msg: "Cart cleared successfully" });
};

export const handleSuccess = async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    throw new BadRequestError("Session ID is missing");
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);
  const userId = parseInt(session.metadata.userId, 10);

  // Get cart items
  const cartItems = await prisma.cart.findMany({
    where: { userId },
    include: { product: true },
  });

  if (!cartItems || cartItems.length === 0) {
    throw new BadRequestError("Cart is empty");
  }

  const order = await prisma.order.create({
    data: {
      userId,
      paymentId: session.payment_intent, // Save the payment intent ID for reference
      orderItems: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalPrice: cartItems.reduce(
        (sum, item) => sum + item.quantity * item.product.price,
        0
      ),
      status: "COMPLETED",
    },
  });

  // Clear the user's cart after a successful order
  await prisma.cart.deleteMany({ where: { userId } });

  res.redirect(`/success?order_id=${order.id}`); // Redirect the user back to the cart page with a success message
};

export const getAllOrders = async (req, res) => {
  const orders = await prisma.order.findMany();
  res.status(StatusCodes.OK).json({ orders });
};
