import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const authMiddleware = (req: Request,res: Response, next: NextFunction
) => {
  try {

    const jwtToken = req.headers.authorization as string;

    // console.log({jwtToken})

    const { _id } = jwt.verify(
      jwtToken,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    // attach to request
    (req as any).user_id = _id;

    next();

  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};