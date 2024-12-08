import { PrismaClient } from "@prisma/client";
let prisma = new PrismaClient();
import { StatusCodes } from "http-status-codes";
import BadRequestError from "../errors/bad-request.js";
import cloudinary from "../configs/cloudinaryConfig.js";
import fs from "fs";

export const createProduct = async (req, res) => {
  const { name, description, hot, price } = req.body;
  if (!name) {
    throw new BadRequestError("Please provide all values");
  }

  let imageUrl = "/uploads/default.jpeg";

  if (req.files && req.files.image) {
    const result = await cloudinary.uploader.upload(
      req.files.image.tempFilePath,
      {
        use_filename: true,
        folder: "products",
      }
    );
    imageUrl = result.secure_url;
  }

  const isHot = hot === "true";

  const product = await prisma.product.create({
    data: {
      name,
      image: imageUrl,
      description,
      hot: isHot,
      price: parseFloat(price),
    },
  });
  res.status(StatusCodes.CREATED).json({ product });
};

export const getAllProducts = async (req, res) => {
  const products = await prisma.product.findMany();
  res.status(StatusCodes.OK).json({ products });
};

export const getProductById = async (req, res) => {
  const { id: productId } = req.params;
  const product = await prisma.product.findUnique({
    where: {
      id: parseInt(productId, 10),
    },
  });
  if (!product) {
    throw new BadRequestError("Product does not exist");
  }
  res.status(StatusCodes.OK).json({ product });
};

export const updateProduct = async (req, res) => {
  const { id: productId } = req.params;
  const { name, image, description, hot, price } = req.body;
  const product = await prisma.product.findUnique({
    where: {
      id: parseInt(productId, 10),
    },
  });
  if (!product) {
    throw new BadRequestError("Product does not exist");
  }
  const updateProduct = await prisma.product.update({
    where: {
      id: parseInt(productId, 10),
    },
    data: {
      name,
      image,
      description,
      hot,
      price,
    },
  });
  res.status(StatusCodes.OK).json({ updateProduct });
};

export const deleteProduct = async (req, res) => {
  const { id: productId } = req.params;
  const product = await prisma.product.findUnique({
    where: {
      id: parseInt(productId, 10),
    },
  });
  if (!product) {
    throw new BadRequestError("Product does not exist");
  }
  const deleteProduct = await prisma.product.delete({
    where: {
      id: parseInt(productId, 10),
    },
  });
  res.status(StatusCodes.OK).json({ msg: "product deleted!" });
};
