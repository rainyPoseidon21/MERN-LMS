import express, { NextFunction, Request, Response } from "express";
import { registrationUser, activateUser } from "../controllers/user.controller";
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

export default userRouter;
