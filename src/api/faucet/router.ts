import express from "express";
import controller from "./controller";

const router = express.Router();

router.get("/claim/:walletId", controller.claim)

export default router