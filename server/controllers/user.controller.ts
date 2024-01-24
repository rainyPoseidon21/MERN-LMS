import { Request, Response, NextFunction } from "express";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { Secret } from "jsonwebtoken";
import { IUser } from "../models/user.model";
import sendMail from "../utils/sendMail";
require("dotenv").config();

// Register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;
    const isEmailExist = await userModel.findOne({ email });
    if (isEmailExist) {
      return next(new ErrorHandler("Email already exist.", 400));
    }

    const userRegisterBody: IRegistrationBody = {
      name,
      email,
      password,
    };

    const activationToken = createActivationToken(userRegisterBody);

    const activationCode = activationToken.activationCode;

    const data = {
      user: {
        name: userRegisterBody.name,
      },
      activationCode,
    };

    try {
      await sendMail({
        email: userRegisterBody.email,
        subject: "Activate your account",
        template: "activation-mail.ejs",
        data,
      });

      res.status(201).json({
        success: true,
        message: `Please check your email ${userRegisterBody.email} to activate your account.`,
        activationToken: activationToken.token,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

// activate new user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { activation_token, activation_code } =
      req.body as IActivationRequest;

    const newUser: { user: IUser; activationCode: string } = jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET as string
    ) as { user: IUser; activationCode: string };

    if (newUser.activationCode !== activation_code) {
      return next(new ErrorHandler("Invalid activation code.", 400));
    }

    const { name, email, password } = newUser.user;
    const existUser = await userModel.findOne({ email });
    if (existUser) {
      return next(new ErrorHandler("Email already exist.", 400));
    }

    const user = await userModel.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      success: true,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};
