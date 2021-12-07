import express from "express";
import controller from "./controller";
export default express
    .Router()
    .get("/", controller.getChainTypes)
    .get("/lastBlock/:specVersion", controller.getLastBlockForSpecVersion)
