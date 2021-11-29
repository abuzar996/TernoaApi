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
      const data = await fetch(`https://raw.githubusercontent.com/capsule-corp-ternoa/chain/main/types/types.json`)
      const typesInfo: {spec: number, name: string}[] = await data.json()
      const maxSpecVersion = Math.max.apply(Math, typesInfo.map((o) =>  o.spec))
      const maxSpecVersionData = typesInfo.find(x => x.spec === maxSpecVersion)
      let filename
      if (queryValues.specVersion){
        const specVersion = Number(queryValues.specVersion)
        const specVersionData = typesInfo.find(x => x.spec === specVersion) || maxSpecVersionData
        filename = specVersionData?.name
      }else{
        filename =  maxSpecVersionData?.name
      }
      if (filename){
        const typesData = await fetch(`https://raw.githubusercontent.com/capsule-corp-ternoa/chain/main/types/${filename}`)
        res.json(await typesData.json())
      }else{
        res.json("types not found");
      }
    }catch(err){
      next(err)
    }
  }
}
export default new Controller();
