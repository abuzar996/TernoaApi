import express from "express";
import controller from "./controller";

const router = express.Router();

router.get("/claim-test-caps/:walletId", controller.claimTestCaps)

export default router