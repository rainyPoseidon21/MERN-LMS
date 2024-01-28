import { ObjectId } from "mongoose";
import userModel, { IUser } from "../models/user.model";
import { NextFunction, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";

//  get user by id
export const getUserById = async (id: string, res: Response) => {
  const user = await userModel.findById(id);
  res.status(200).json({
    success: true,
    user,
  });
};
