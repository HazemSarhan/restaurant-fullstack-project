import { PrismaClient } from "@prisma/client";
let prisma = new PrismaClient();
import { StatusCodes } from "http-status-codes";
import BadRequestError from "../errors/bad-request.js";
import cloudinary from "../configs/cloudinaryConfig.js";
import fs from "fs";

export const createCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new BadRequestError("Please provide all values");
  }

  let image = "/uploads/default.jpeg";

  if (req.files && req.files.image) {
    const result = await cloudinary.uploader.upload(
      req.files.image.tempFilePath,
      {
        use_filename: true,
        folder: "products",
      }
    );
    image = result.secure_url;
  }
  const category = await prisma.category.create({
    data: {
      name,
      description,
      image,
    },
  });
  res.status(StatusCodes.CREATED).json({ category });
};

export const getAllCategories = async (req, res) => {
  const categories = await prisma.category.findMany();
  res.status(StatusCodes.OK).json({ categories });
};

export const getCategoryById = async (req, res) => {
  const { id: categoryId } = req.params;
  const category = await prisma.category.findUnique({
    where: {
      id: parseInt(categoryId, 10),
    },
  });
  if (!category) {
    throw new BadRequestError("Category does not exist");
  }
  res.status(StatusCodes.OK).json({ category });
};

export const updateCategory = async (req, res) => {
  const { id: categoryId } = req.params;
  const { name, description, image } = req.body;
  const category = await prisma.category.update({
    where: {
      id: parseInt(categoryId, 10),
    },
    data: {
      name,
      description,
      image,
    },
  });
  res.status(StatusCodes.OK).json({ category });
};

export const deleteCategory = async (req, res) => {
  const { id: categoryId } = req.params;
  const category = await prisma.category.findUnique({
    where: {
      id: parseInt(categoryId, 10),
    },
  });
  if (!category) {
    throw new BadRequestError("Category does not exist");
  }
  await prisma.category.delete({
    where: {
      id: parseInt(categoryId, 10),
    },
  });
  res.status(StatusCodes.OK).json({ msg: "Category deleted successfully" });
};
