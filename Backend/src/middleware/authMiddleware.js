import asyncHandler from "express-async-handler";    //this is used because Express async functions me try/catch bar-bar likhna padta ,     Ye automatically error ko next(error) me bhej deta
import jwt from "jsonwebtoken";       //token has only user id
import User from "../models/auth/UserModel.js";

export const protect = asyncHandler(async (req, res, next) => {
  try {
    // check if user is logged in
    const token = req.cookies.token;

    if (!token) {
      // 401 Unauthorized
      res.status(401).json({ message: "Not authorized, please login!" });
      return;
    }

    // verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);                //decoded = { id: "mongodb_user_id", iat, exp }     where iat is issued at and exp is expiry in seconds

    // get user details from the token ----> exclude password
    const user = await User.findById(decoded.id).select("-password");

    // check if user exists
    if (!user) {
      res.status(404).json({ message: "User not found!" });
      return;
    }

    // set user details in the request object
    req.user = user;              //Controllers me token verify dobara nahi karna , Direct use:

    next();    //Auth passed. Let the request continue. and without next() request stops and controller never runs 
  } catch (error) {
    // 401 Unauthorized
    res.status(401).json({ message: "Not authorized, token failed!" });
  }
});

// admin middleware
export const adminMiddleware = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    // if user is admin, move to the next middleware/controller
    next();
    return;
  }
  // if not admin, send 403 Forbidden --> terminate the request
  res.status(403).json({ message: "Only admins can do this!" });
});

export const creatorMiddleware = asyncHandler(async (req, res, next) => {
  if (
    (req.user && req.user.role === "creator") ||
    (req.user && req.user.role === "admin")
  ) {
    // if user is creator, move to the next middleware/controller
    next();
    return;
  }
  // if not creator, send 403 Forbidden --> terminate the request
  res.status(403).json({ message: "Only creators can do this!" });
});

// verified middleware
export const verifiedMiddleware = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.isVerified) {
    // if user is verified, move to the next middleware/controller
    next();
    return;
  }
  // if not verified, send 403 Forbidden --> terminate the request
  res.status(403).json({ message: "Please verify your email address!" });
});
