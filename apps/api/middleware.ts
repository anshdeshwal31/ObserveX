import { getAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  
  if (!auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach to request to maintain compatibility with existing controllers
  (req as any).user_id = auth.userId;

  next();
};