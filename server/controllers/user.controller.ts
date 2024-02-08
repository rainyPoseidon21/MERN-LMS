import { Request, Response, NextFunction } from "express";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { IUser } from "../models/user.model";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service";
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

// this jwt token is only for activation user use case,
//  otherwise use the jwt token from user.model.ts
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

// login user
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body as ILoginRequest;
    if (!email || !password) {
      return next(new ErrorHandler("Please enter email and password.", 400));
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid email.", 400));
    }

    const isPasswordMatch = await user.ComparePassword(password);

    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid password.", 400));
    }

    sendToken(user, 200, res);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};

//  logout user
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.cookie("access_token", "", { maxAge: 1 });
    res.cookie("refresh_token", "", { maxAge: 1 });
    const userId = req.user?._id || "";
    redis.del(userId);
    res.status(200).json({
      success: true,
      message: "User logged out successfully.",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};

// update access token
export const updateAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token as string;
    const decoded = jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN as string
    ) as JwtPayload;

    if (!decoded) {
      const message = "Could not refresh token, access token not valid.";
      return next(new ErrorHandler(message, 400));
    }

    const session = await redis.get(decoded.id as string);
    if (!session) {
      const message = "Could not refresh token, redis session not found.";

      return next(new ErrorHandler(message, 400));
    }

    const user = JSON.parse(session);

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN as string,
      {
        expiresIn: "5m",
      }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN as string,
      {
        expiresIn: "3d",
      }
    );

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(200).json({
      success: "true",
      accessToken,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};

// getting user info
export const getUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (userId === undefined) {
      return next(new ErrorHandler("Could not find any logged user.", 400));
    }
    await getUserById(userId, res);
  } catch (error: any) {
    console.log(req.body._id);
    return next(new ErrorHandler(error.message, 400));
  }
};

// social auth

interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
  password: string;
}

export const socialAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, avatar, password } = req.body as ISocialAuthBody;
    const user = await userModel.findOne({ email });
    if (!user) {
      const newUser = await userModel.create({ email, name, avatar, password });
      sendToken(newUser, 200, res);
    } else {
      sendToken(user, 200, res);
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};

// update user info
interface IUpdateUserInfo {
  name: string;
  email: string;
}

export const updateUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name } = req.body as IUpdateUserInfo;
    const userId = req.user?._id;
    if (userId === undefined) {
      return next(new ErrorHandler("Could not find any logged user.", 400));
    }
    const user = await userModel.findById(userId);
    if (email && user) {
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist.", 400));
      }
      user.email = email;
    }

    if (user && name) {
      user.name = name;
    }

    await user?.save();

    await redis.set(user?._id, JSON.stringify(user));

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};

// update user password
interface IUpdateUserPassword {
  oldPassword: string;
  newPassword: string;
}

export const updateUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { oldPassword, newPassword } = req.body as IUpdateUserPassword;
    const userId = req.user?._id;

    if (userId === undefined) {
      return next(new ErrorHandler("Could not find any logged user.", 400));
    }
    const user = await userModel.findById(userId).select("+password");
    if (user && oldPassword) {
      const isPasswordMatch = await user.ComparePassword(oldPassword);
      if (isPasswordMatch) {
        user.password = newPassword;
        await user.save();
      } else {
        return next(
          new ErrorHandler(
            "The old password is not matched the one in database",
            400
          )
        );
      }
    } else {
      return next(
        new ErrorHandler(
          "The user is either not authenticated or the old password is not defined.",
          400
        )
      );
    }
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};
