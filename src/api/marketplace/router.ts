import express from "express";
import controller from "./controller";

const router = express.Router();

router.post("/", controller.createMarketplace)
router.get("/:mpId", controller.getMarketplace)
router.post("/:mpId", controller.updateMarketplace)

export default router