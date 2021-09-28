import "./src/common/env";
import express from 'express'
import mongoose from "mongoose";
import cors from "cors";
import * as Sentry from "@sentry/node"
import * as Tracing from "@sentry/tracing"
import errorHandler from "./src/common/error.handler";
import faucetRouter from './src/api/faucet/router'
import marketplaceRouter from './src/api/marketplace/router'
import userRouter from './src/api/user/router'

const app = express()
const port = process.env.PORT || 5000
const mongoURI = process.env.MONGODB_URI || ""

if (process.env.SENTRY_DSN){
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({
        app,
      }),
    ],
    tracesSampleRate: 1.0,
  });
}

// CORS
app.use(cors());

// Express middlewares
app.use(express.json({ limit: process.env.REQUEST_LIMIT || "100kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.REQUEST_LIMIT || "100kb",
  })
);
app.use(express.text({ limit: process.env.REQUEST_LIMIT || "100kb" }));

//Sentry
if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") app.use(Sentry.Handlers.requestHandler());
if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") app.use(Sentry.Handlers.tracingHandler());

// Routes
app.use('/api/faucet', faucetRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/users', userRouter);

//Sentry error middleware
if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") app.use(Sentry.Handlers.errorHandler());

// Error middleware
app.use(errorHandler);

// Mongo connection
mongoose.connect(mongoURI)
.then(() => {
  // Launch server
  console.log("db connection successfull");
  app.listen(port, () => {
    console.log(`Server is listening on port: ${port} and connected to DB`);
  })
})
.catch(err => {
  console.log(err);
});
