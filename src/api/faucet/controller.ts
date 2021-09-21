import { NextFunction, Request, Response } from "express";
import { IFaucetClaim } from "../../interfaces/IFaucetClaim";
import faucetClaimModel from "../../models/faucetClaim";

export class Controller {
    async claim(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const { walletId } = req.params
            //Check if claim is possible
            if (walletId.length !== 48) throw new Error('Invalid address formar')
            const lastClaim = await faucetClaimModel.findOne({walletId}).sort({createdAt: -1})
            console.log(lastClaim)
            if (lastClaim && lastClaim.createdAt){
                const timeDiff = new Date().getTime() - lastClaim.createdAt.getTime()
                if (timeDiff < (24 * 3600 * 1000)){
                    console.log(timeDiff)
                    throw new Error('You need to wait before making another claim')
                }
            }
            // CLAIM HERE FROM BC
            
            //Add claim in DB
            const claim: IFaucetClaim = { walletId }
            const claimDB = new faucetClaimModel(claim)
            await claimDB.save()
            res.status(200).json({message: `Successfully claimed for address ${walletId}`, claim: claim});
        }catch(err){
            next(err)
        }
    }   
}
export default new Controller();