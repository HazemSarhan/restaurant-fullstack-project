import { PrismaClient } from "@prisma/client";
let prisma = new PrismaClient();
import { StatusCodes } from "http-status-codes";
import BadRequestError from "../errors/bad-request.js";
import cloudinary from "../configs/cloudinaryConfig.js";
import fs from "fs";

export const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile_picture: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.status(StatusCodes.OK).json({ users });
};

export const showMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile_picture: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.status(StatusCodes.OK).json({ user });
};

export const getUserById = async (req, res) => {
  const { id: userId } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(userId, 10),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile_picture: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    throw new BadRequestError("User does not exist");
  }
  res.status(StatusCodes.OK).json({ user });
};

export const updateUser = async (req, res) => {
  const { id: userId } = req.params;
  const { name, email, role } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(userId, 10),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile_picture: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    throw new BadRequestError("User does not exist");
  }

  // uploading image to the cloud
  let profile_picture = "/uploads/default.jpeg"; // default value
  if (req.files && req.files.profile_picture) {
    const result = await cloudinary.uploader.upload(
      req.files.profile_picture.tempFilePath,
      {
        use_filename: true,
        folder: "lms-images",
      }
    );
    fs.unlinkSync(req.files.profile_picture.tempFilePath);
    profile_picture = result.secure_url;
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: parseInt(userId, 10),
    },
    data: {
      name,
      email,
      profile_picture,
      role,
    },
  });
  res.status(StatusCodes.OK).json({ user: updatedUser });
};

export const deleteUser = async (req, res) => {
  const { id: userId } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(userId, 10),
    },
  });
  if (!user) {
    throw new BadRequestError("User does not exist");
  }
  await prisma.user.delete({
    where: {
      id: parseInt(userId, 10),
    },
  });
  res.status(StatusCodes.OK).json({ msg: "User deleted successfully" });
};
