import express from "express";
import { json } from "body-parser";
import { currentUserRouter } from "./routes/currentUser";
import { signInRouter } from "./routes/signIn";
import { signOutRouter } from "./routes/signOut";
import { signUpRouter } from "./routes/signUp";
import { errorHandler } from "@ticketsd/common";
import { NotFoundError } from "@ticketsd/common";
import cookieSession from "cookie-session";
import cors from "cors";



const app = express();
app.set("trust proxy", true)
app.use(json());

app.use(
  cors({
    origin: 'http://ticketing.dev',  // frontend
    credentials: true,                //  allow cookies
  })
);

app.use(
  cookieSession({
    signed: false,  
    secure: process.env.NODE_ENV === 'production'  
   // secure: process.env.NODE_ENV !== 'test'
  })
);

app.use((req, res, next) => {
  console.log("Request URL:", req.url);
  next();
});

app.use(currentUserRouter);
app.use(signInRouter);
app.use(signOutRouter);
app.use(signUpRouter);
//"/{*splat}"
app.all("/{*splat}", async(req,res) => {
  console.log("Unmatched route requested:", req.url);
    throw new NotFoundError();
    //res.send("Route not found");
});

app.use(errorHandler);

export { app }
