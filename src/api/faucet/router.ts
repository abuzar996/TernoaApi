import express from "express";
import controller from "./controller";

const router = express.Router();

router.get("/claim-test-caps/:walletId", controller.claimTestCaps)
router.get("/claim-test-nft/:walletId", controller.claimTestNFT)

export default router