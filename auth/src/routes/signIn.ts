import express , {Request, Response} from "express";
import {body, validationResult} from "express-validator";
import { validateRequest } from "@ticketsd/common";
import jwt from 'jsonwebtoken';

import { Password } from '../services/password';
import { User } from '../models/user';
import { BadRequestError } from "@ticketsd/common";

const router = express.Router();

router.post("/api/users/signin", 
  [
    body("email")
    .isEmail()
    .withMessage("email must be valid"),
    body("password")
    .trim()
    .notEmpty()
    .withMessage("you must supply a password")
  ],
  validateRequest,
async (req: Request, res: Response) => {
  const { email, password } = req.body;


    const existingUser = await User.findOne({ email });
    
    // allUsers = await User.find({});
//console.log(' All users in DB:', allUsers);

    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordsMatch = await Password.compare(
      existingUser.password,
      password
    );
  
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid Credentials');
    }

    // Generate JWT
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY!
    );


    // Store it on session object
    req.session = {
      jwt: userJwt,
    };


    res.status(200).send(existingUser);  
});

export { router as signInRouter };
