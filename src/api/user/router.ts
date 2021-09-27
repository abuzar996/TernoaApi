import express from "express";
import controller from "./controller";

const router = express.Router();

router.patch("/reviewRequested/:id", controller.reviewRequested)
router.get("/", controller.all)
router.get("/verifyTwitter/callback", controller.verifyTwitterCallback)
router.get("/verifyTwitter/:id", controller.verifyTwitter)
router.get("/getUsers", controller.getUsersBywalletId)
router.get("/:id", controller.getUser)
router.post("/create", controller.newUser)
router.post("/like", controller.likeNft)
router.post("/unlike", controller.unlikeNft)
router.post("/:walletId", controller.updateUser);

export default router