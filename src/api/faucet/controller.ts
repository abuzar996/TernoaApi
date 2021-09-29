import { NextFunction, Request, Response } from "express";
import { IFaucetClaim } from "../../interfaces/IFaucetClaim";
import faucetClaimModel from "../../models/faucetClaim";
import { getKeyring, getChainApiInstance, unFormatBalance, isValidAddress } from "../../utils/polka";
import { DEFAULT_CAPS_AMOUNT } from "../../utils";

const parseArgs = require('minimist')(process.argv.slice(2))
const SEED=parseArgs["SEED"] ? parseArgs["SEED"] : null

export class Controller {
    async claimTestCaps(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const { walletId } = req.params
            // Check address validity
            if (walletId.length !== 48 || !isValidAddress(walletId)) throw new Error('Invalid address format')
            //Check if claim is possible
            const lastClaim = await faucetClaimModel.findOne({walletId}).sort({createdAt: -1})
            if (lastClaim && lastClaim.createdAt){
                const timeDiff = new Date().getTime() - lastClaim.createdAt.getTime()
                if (timeDiff < (1 * 24 * 3600 * 1000)){
                    const timeLeftForNextClaim = (1 * 24 * 3600 * 1000) - timeDiff
                    const seconds = (timeLeftForNextClaim/1000)%60
                    const minutes = (timeLeftForNextClaim/(1000*60))%60
                    const hours = (timeLeftForNextClaim/(1000*60*60))%60
                    let err = (new Error(`You need to wait ${Math.floor(hours)}h${Math.floor(minutes)}m${Math.floor(seconds)}s before making another claim`)) as any
                    err.status = 403
                    return next(err)
                }
            }
            // CLAIM HERE FROM BC
            const keyring = await getKeyring()
            if (SEED && keyring){
                const sender = keyring.createFromUri(SEED)
                let api = await getChainApiInstance()
                let extrinsic = api.tx.balances.transferKeepAlive(walletId, unFormatBalance(DEFAULT_CAPS_AMOUNT));
                const unsub = await extrinsic.signAndSend(sender, async (result: any) => {
                    if (result.status.isInBlock) {
                        console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
                        unsub();
                        /*if (result. is ok){

                        }*/
                        //Add claim in DB
                        const claim: IFaucetClaim = { walletId }
                        const claimDB = new faucetClaimModel(claim)
                        await claimDB.save()
                        return res.status(200).json({message: `Successfully claimed for address ${walletId}`, claim: claim});
                    }
                })
            }else{
                let err = (new Error(`An error has occured when trying to get you caps, please try again later.`)) as any
                return next(err)
            }
        }catch(err){
            return next(err)
        }
    }   
}
export default new Controller();