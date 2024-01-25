import express, { NextFunction, Request, Response } from "express";
import {
  registrationUser,
  activateUser,
  loginUser,
  logoutUser,
} from "../controllers/user.controller";
import { CatchAsyncError } from "../middleware/catchAsyncError";

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
  (req: Request, res: Response, next: NextFunction) => {
    CatchAsyncError(logoutUser(req, res, next));
  }
);

export default userRouter;
