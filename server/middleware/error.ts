import e, { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";

export const ErrorMiddleWare = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.StatusCode = err.StatusCode || 500;
  err.message = err.message || `Internal server error.`;

  // wrong mongodb id
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
    err = new ErrorHandler(message, 400);
  }

  // wrong jwt error
  if (err.name === `JsonWebTokenError`) {
    const message = `Json web token is invalid, try again.`;
    err = new ErrorHandler(message, 400);
  }

  // JWT expired error
  if (err.name === `TokenExpiredError`) {
    const message = `Json web token is expired, try again.`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
