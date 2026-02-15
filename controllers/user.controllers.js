import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import signUpSchema from "../schema/signUpSchema.validation.js";
import logInSchema from "../schema/loginSchema.validations.js";
import * as z from "zod";
import ApiResponse from "../utils/ApiResponse.js";
import {
  generateHashedPassword,
  comparePassword,
} from "../utils/password.utils.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokens.util.js";

const signUpController = async (req, res) => {
  const { name, password, email } = req.body;

  try {
    // validating user input
    const validatingUserInput = await signUpSchema.safeParse({
      name: name.toLowerCase(),
      email,
      password,
    });

    if (!validatingUserInput.success) {
      const pretty = z.prettifyError(validatingUserInput.error);
      return res
        .status(400)
        .json(new ApiResponse(400, "Validation Error", pretty));
    }

    // checking if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, "User already exists", "Unable to signup"));
    }

    // hashing password before storing in db
    const hashedPassword = await generateHashedPassword(password);
    if (!hashedPassword)
      return res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "Internal Server Error: password hash error",
            "Unable to signup",
          ),
        );

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!newUser)
      return res
        .status(400)
        .json(
          new ApiResponse(400, "Unable to create user", "Unable to signup"),
        );

    return res.status(201).json({
      newUser,
    });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "Internal Server Error", "Unable to signup"));
  }
};

const loginController = async (req, res) => {
  const { email, password } = req.body;
  try {
    const logInValidation = await logInSchema.safeParse({
      email,
      password,
    });

    if (!logInValidation.success) {
      const pretty = z.prettifyError(logInValidation.error);
      return res
        .status(400)
        .json(new ApiResponse(400, "Validation Error", pretty));
    }

    // checking if the user exists or not
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json(new ApiResponse(404, "User not found", "Unable to login"));
    }

    const isPasswordValid = await comparePassword(
      password,
      existingUser.password,
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json(new ApiResponse(401, "Invalid Credentials", "Unable to login"));
    }

    // generating tokens for the user
    const payload = {
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    };

    // access token is for short term and refresh token would be storedin db for long term
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // hashing the refresh token before storing in db
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    if (!hashedRefreshToken)
      return res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "Internal Server Error:refresh hasherror",
            "Unable to login",
          ),
        );

    // saving refresh token in db
    const updatedUser = await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });

    if (!updatedUser)
      return res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "Internal Server Error:refresh token",
            "Unable to login",
          ),
        );

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "true",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      partitioned: true, // ← Add this (Express 4.18.3+)
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "true",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      partitioned: true, // ← Add this (Express 4.18.3+)
    });

    const userRole = existingUser.role;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          userRole,
          `Logged In Successfully , enjoy solving problems`,
        ),
      );
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "Internal Server Error", "Unable to login"));
  }
};

const provideMyRole = async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json(
        new ApiResponse(401, "Unauthorised Access", "user not found in req"),
      );
  }
  const user = req.user;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.role,
        `user role has been fetched successfully`,
      ),
    );
};

const logOutController = async (req, res) => {
  // logging out by clearing cookies and also i need to clear the refresh token from db ??
  // for paid version , i would be clearing the refresh token from db as well to preven misuse of refresh token after logout but for free not spinning up the db
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Logged out successfully",
        "You have been logged out successfully",
      ),
    );
};

export { signUpController, loginController, provideMyRole, logOutController };
