import "./src/common/env";
import express from 'express'
import mongoose from "mongoose";
import cors from "cors";
import errorHandler from "./src/common/error.handler";
import faucetRouter from './src/api/faucet/router'
import marketplaceRouter from './src/api/marketplace/router'

const app = express()
const port = process.env.PORT || 5000
const mongoURI = process.env.MONGODB_URI || ""

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

// Routes
app.use('/api/faucet', faucetRouter);
app.use('/api/marketplace', marketplaceRouter);

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
