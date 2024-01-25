import express, { NextFunction, Request, Response } from "express";
import {
  registrationUser,
  activateUser,
  loginUser,
  logoutUser,
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

export default userRouter;
