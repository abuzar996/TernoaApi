import { NextFunction, Request, Response } from "express";
import { isValidAddress } from "../../utils/polka";
import faucetClaimService from "../../services/faucetClaim"

export class Controller {
    async claimTestCaps(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const { walletId } = req.params
            // Check address validity
            if (walletId.length !== 48 || !isValidAddress(walletId)) throw new Error('Invalid address format')
            const claim = await faucetClaimService.addClaimToQueue(walletId)
            res.status(200).json({ message: `Successfully requested caps for ${walletId}. Caps should appear in your balance soon`, claim: claim });
        }catch(err){
            return next(err)
        }
    }   
}
export default new Controller();