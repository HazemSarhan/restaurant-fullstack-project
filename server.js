// Server Packages
import dotenv from "dotenv";
import "express-async-errors";
dotenv.config();
import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const app = express();

// Rest Of Packages
import path from "path";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

// Middlewares
import notFound from "./middleware/not-found.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";
import { checkAuthentication } from "./middleware/authentication.js";
import {
  authenticatedUser,
  authorizePermissions,
} from "./middleware/authentication.js";

// EJS Configurations
app.set("view engine", "ejs");
app.set("views", "./views");

// Routes
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import orderRoutes from "./routes/order.routes.js";

app.use(express.static("./public"));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
  })
);
app.use(checkAuthentication);

// Homepage
app.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    const hotProducts = await prisma.product.findMany({
      where: {
        hot: true,
      },
    });
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("index", { categories, hotProducts });
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).send("Server Error");
  }
});

// Categories Page
app.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("categories", { categories });
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Menu Page
app.get("/menu", async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("menu", { products });
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Login Page
app.get("/login", (req, res) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.user || null;

  res.render("login");
});

// Register Page
app.get("/register", (req, res) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.user || null;
  res.render("register");
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("token"); // Clear the authentication token
  res.redirect("/login"); // Redirect to the login page
});

// Dashboard
app.get(
  "/dashboard",
  [authenticatedUser, authorizePermissions("ADMIN")],
  async (req, res) => {
    try {
      const products = await prisma.product.findMany();
      const categoriesCount = await prisma.category.count();
      const productsCount = await prisma.product.count();
      const customers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      const customersCount = await prisma.user.count();
      res.locals.currentPath = req.path;
      res.locals.user = req.user || null;

      res.render("dashboard", {
        products,
        customers,
        categoriesCount,
        productsCount,
        customersCount,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/customers", async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("customers", { customers });
  } catch (error) {
    console.error("Error fetching dashboard data:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/customers/:id/edit", async (req, res) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!customer) {
      return res.status(404).send("Customer not found");
    }
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("edit-user", { customer });
  } catch (error) {
    console.error("Error fetching customer:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({});
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("products", { products });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/products/:id/edit", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: parseInt(id, 10),
      },
    });
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("edit-product", { product });
  } catch (error) {
    console.error("Error fetching product:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/products/create", (req, res) => {
  res.locals.user = req.user || null; // Pass user data if available
  res.render("create-product");
});

app.get("/category", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("category", { categories });
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/category/:id/edit", async (req, res) => {
  const { id } = req.params;

  try {
    const category = await prisma.category.findUnique({
      where: {
        id: parseInt(id, 10),
      },
    });
    if (!category) {
      return res.status(404).send("category not found");
    }
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("edit-category", { category });
  } catch (error) {
    console.error("Error fetching category:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/category/create", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("create-category", { categories });
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Order

app.get("/cart", [authenticatedUser], async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });
    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("cart", { cartItems });
  } catch (error) {
    console.error("Error fetching cart items:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/success", async (req, res) => {
  try {
    const orderId = req.query.order_id;
    if (!orderId) {
      return res.status(400).json({ msg: "Invalid order ID" });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId, 10) },
    });

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.locals.currentPath = req.path;
    res.locals.user = req.user || null;
    res.render("success", { order });
  } catch (error) {
    console.error("Error rendering success page:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    res.render("orders", { orders });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/orders", orderRoutes);

app.use(notFound);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
  } catch (error) {
    console.log(error.message);
  }
};

start();
