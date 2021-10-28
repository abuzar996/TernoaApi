import { NextFunction, Request, Response } from "express";
import { convertAddress, isValidAddress } from "../../utils/polka";
import faucetClaimService from "../../services/faucetClaim"
import { FAUCET_ADDRESS, getSerieIdByQrId } from "../../utils";

export class Controller {
    async claimTestCaps(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const { walletId } = req.params
            // Check address validity
            if (!isValidAddress(walletId) || walletId === FAUCET_ADDRESS){
                throw new Error('Invalid address format')
            }
            const walletIdFormatted = convertAddress(walletId) || walletId
            const claim = await faucetClaimService.addCAPSClaimToQueue(walletIdFormatted)
            res.status(200).json({ message: `Successfully requested caps for ${walletIdFormatted}. Caps should appear in your balance soon`, claim: claim });
        }catch(err){
            return next(err)
        }
    }

    async claimTestNFT(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const { walletId } = req.params
            const { qrId } = req.query
            let serieId = null
            serieId = qrId ? getSerieIdByQrId(qrId as string) : process.env.NFT_SERIES_ID
            if (!serieId){
                let err = (new Error(`No NFT series to claim`)) as any
                throw err
            }
            // Check address validity
            if (walletId.length !== 48 || !isValidAddress(walletId)) throw new Error('Invalid address format')
            const claim = await faucetClaimService.addNFTClaimToQueue(walletId, serieId as string)
            res.status(200).json({ message: `Successfully requested NFT. NFT will appear in your account soon`, claim: claim });
        }catch(err){
            return next(err)
        }
    }      
}
export default new Controller();