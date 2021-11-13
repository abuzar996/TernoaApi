import { NextFunction, Request, Response } from "express";
import fetch from "node-fetch";
import { validationGetChainTypes } from "../../validators/chainTypesValidators";

export class Controller {
  async getChainTypes(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try{
      const queryValues = validationGetChainTypes(req.query)
      const data = await fetch(`https://raw.githubusercontent.com/capsule-corp-ternoa/chain/${queryValues.chain ? queryValues.chain : "main"}/types.json`)
      const types = await data.json()
      res.json(types);
    }catch(err){
      next(err)
    }
  }
}
export default new Controller();
