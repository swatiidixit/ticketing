import express, {Request, Response} from "express";
const router = express.Router();
import jwt  from "jsonwebtoken";
import {body, validationResult} from "express-validator";
import { validateRequest } from "@ticketsd/common";
import { User } from "../models/user";
//import { RequestValidationError } from "../errors/request_validation_error";
import { BadRequestError } from "@ticketsd/common";
//import { DatabaseConnectionError } from "../errors/database_connection_error";


router.post("/api/users/signup",[
    body("email")
    .isEmail()
    .withMessage("email must be valid"),
    body("password")
    .trim()
    .isLength({min:4, max:20})
    .withMessage("password must be between 4 and 20 characters")
], 
validateRequest,
async(req : Request, res:Response) => {
    
    const {email,password} = req.body;

  const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new BadRequestError('Email in use');
    }

    const user = User.build({ email, password });
    await user.save();

  const userJwt = jwt.sign({
    id: user.id,
    email: user.email
  },process.env.JWT_KEY!);

  req.session = {
    jwt: userJwt
  }

    res.status(201).send(user);
  }

);

export { router as signUpRouter };
