import { NextFunction, Request, Response } from "express";
import EventWhitelistSignatureModel from "../../models/eventWhitelistSignature";
import { isValidSignatureEth } from "../../utils";
import { validationUpdateWhitelistSignature, validationGetWhitelistSignature } from "../../validators/eventWhitelistSignatureValidators";
import { ipfsGatewayUri } from '../../utils/ipfs/ipfs.const';
import TernoaIpfsApi from "../../utils/ipfs/ipfs.helper";
import { isValidAddress } from "../../utils/polka";

const ipfsApi = new TernoaIpfsApi();

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
      const queryValues = validationGetWhitelistSignature(req.params)
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
      if (!isValidAddress(queryValues.walletId)) throw new Error('Invalid Ternoa address format')
      const whitelistSignatureObject = await EventWhitelistSignatureModel.findOne({ethAddress: queryValues.ethAddress})
      if (!whitelistSignatureObject) throw new Error("You need to be whitelisted to access this feature")
      if (!isValidSignatureEth(queryValues.walletId, queryValues.signature, queryValues.ethAddress)) throw new Error("Invalid signature")
      try{
        const fileName = `whitelist_${new Date().toISOString().split('.')[0].split(':').join('-')}-${(10000*Math.random()).toPrecision(4)}.json`
        const ipfsResult = await ipfsApi.addFile({walletId: queryValues.walletId, signature: queryValues.signature, ethAddress: queryValues.ethAddress}, fileName)
        whitelistSignatureObject.eventNumber = 1
        whitelistSignatureObject.signature = queryValues.signature
        whitelistSignatureObject.walletId = queryValues.walletId
        whitelistSignatureObject.ipfsLink = `${ipfsGatewayUri}/${ipfsResult.Hash}`
        await whitelistSignatureObject.save()
        res.json({message:"success", whitelistObject: whitelistSignatureObject})
      }catch{
        throw new Error("An error has occured while saving your information, please try again.")
      }
    }catch(err){
      next(err)
    }
  }
}
export default new Controller();
