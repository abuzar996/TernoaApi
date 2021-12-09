import { NextFunction, Request, Response } from "express";
import EventWhitelistSignatureModel from "../../models/eventWhitelistSignature";
import { isValidSignatureEth } from "../../utils";
import { validationUpdateWhitelistSignature, validationGetWhitelistSignature } from "../../validators/eventWhitelistSignatureValidators";

export class Controller {
  async getData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try{
      const data = await EventWhitelistSignatureModel.find()
      res.json(data)
    }catch(err){
      next(err)
    }
  }

  async getWhitelistSignature(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try{
      const queryValues = validationGetWhitelistSignature(req.query)
      const data = await EventWhitelistSignatureModel.findOne({ethAddress: queryValues.ethAddress})
      res.json(data)
    }catch(err){
      next(err)
    }
  }
  
  async updateWhitelistSignature(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try{
      const queryValues = validationUpdateWhitelistSignature(req.query)
      const whitelistSignatureObject = await EventWhitelistSignatureModel.findOne({ethAddress: queryValues.ethAddress})
      if (!whitelistSignatureObject) throw new Error("You need to be whitelisted to access this feature")
      if (!isValidSignatureEth(queryValues.walletId, queryValues.signature, queryValues.ethAddress)) throw new Error("Invalid signature")
      whitelistSignatureObject.eventNumber = 1
      whitelistSignatureObject.signature = queryValues.signature
      whitelistSignatureObject.walletId = queryValues.walletId
      await whitelistSignatureObject.save()
      res.json({message:"success", whitelistObject: whitelistSignatureObject})
    }catch(err){
      next(err)
    }
  }
}
export default new Controller();
