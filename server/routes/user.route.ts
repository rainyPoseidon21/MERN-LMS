import express, { NextFunction, Request, Response } from "express";
import {
  registrationUser,
  activateUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updateUserPassword,
} from "../controllers/user.controller";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import { isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();

userRouter.post(
  "/registration",
  (req: Request, res: Response, next: NextFunction) => {
    CatchAsyncError(registrationUser(req, res, next));
  }
);

userRouter.post(
  "/activateUser",
  (req: Request, res: Response, next: NextFunction) => {
    CatchAsyncError(activateUser(req, res, next));
  }
);

userRouter.post("/login", (req: Request, res: Response, next: NextFunction) => {
  CatchAsyncError(loginUser(req, res, next));
});

userRouter.post(
  "/logout",
  isAuthenticated,
  (req: Request, res: Response, next: NextFunction) => {
    CatchAsyncError(logoutUser(req, res, next));
  }
);

userRouter.get(
  "/refreshToken",
  (req: Request, res: Response, next: NextFunction) => {
    CatchAsyncError(updateAccessToken(req, res, next));
  }
);

// this authenticated will return the user info (current logged in user)
userRouter.get(
  "/getUserInfo",
  isAuthenticated,
  (req: Request, res: Response, next: NextFunction) => {
    CatchAsyncError(getUserInfo(req, res, next));
  }
);

userRouter.post(
  "/socialAuth",
  (req: Request, res: Response, next: NextFunction) => {
    CatchAsyncError(socialAuth(req, res, next));
  }
);

// update logged user email or name
userRouter.put(
  "/updateUser",
  isAuthenticated,
  (req: Request, res: Response, next: NextFunction) => {
    CatchAsyncError(updateUserInfo(req, res, next));
  }
);

// update logged user password
userRouter.put(
  "/updateUserPassword",
  isAuthenticated,
  (req: Request, res: Response, next: NextFunction) => {
    CatchAsyncError(updateUserPassword(req, res, next));
  }
);
export default userRouter;
