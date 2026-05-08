import jwt from "jsonwebtoken";
import { Response } from "express";

const generateToken = (res: Response, userId: string) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET || "fallback_secret",
    {
      expiresIn: "30d",
    },
  );

  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: !isDev, // Secure only in production/stage (HTTPS)
    sameSite: isDev ? "lax" : "none",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

export default generateToken;
