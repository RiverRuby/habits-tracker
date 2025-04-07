import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      body: {
        userId?: string;
        [key: string]: any;
      };
    }
  }
}
