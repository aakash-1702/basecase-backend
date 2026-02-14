import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../lib/prisma.js";
import { generateAccessToken } from "../utils/tokens.util.js";
import bcrypt from "bcryptjs";

dotenv.config();

const isAuthenticated = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    // ❌ no refresh token at all → logout
    if (!refreshToken) {
      return res
        .status(401)
        .json(new ApiResponse(401, "Unauthorized", "Please login"));
    }

    /* ---------------- TRY ACCESS TOKEN ---------------- */
    if (accessToken) {
      try {
        const decoded = jwt.verify(
          accessToken,
          process.env.ACCESS_TOKEN_SECRET,
        );

        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
        });

        if (!user) throw new Error("User not found");

        req.user = user;
        return next();
      } catch {
        // access token expired → fall through to refresh
      }
    }

    /* ---------------- REFRESH TOKEN FLOW ---------------- */

    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await prisma.user.findUnique({
      where: { id: decodedRefresh.id },
    });

    if (!user || !user.refreshToken) {
      return res
        .status(401)
        .json(new ApiResponse(401, "Unauthorized", "Please login"));
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isMatch) {
      return res
        .status(401)
        .json(new ApiResponse(401, "Unauthorized", "Token reuse detected"));
    }

    // issue new access token
    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
    });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json(new ApiResponse(401, "Unauthorized", "Please login"));
  }
};

export default isAuthenticated;
