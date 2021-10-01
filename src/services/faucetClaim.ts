import FaucetClaimModel from "../models/faucetClaim";
import { IFaucetClaim } from "../interfaces/IFaucetClaim";
import { DEFAULT_FAUCET_BATCH_SIZE } from "../utils";
import { processFaucetClaims } from "../utils/polka";

export class FaucetClaimService {
  /**
  * Add faucet claim to queue
  * @param walletId - Wallet to give caps to
  * @throws Will throw an error if can't claim yet or db is unreachable
  */
  async addClaimToQueue(
    walletId: string,
  ): Promise<any> {
    try {
      const lastClaim = await FaucetClaimModel.findOne({walletId}).sort({createdAt: -1})
      //Check if claim is possible
      if (lastClaim && lastClaim.createdAt){
        const timeDiff = new Date().getTime() - lastClaim.createdAt.getTime()
        if (timeDiff < (1 * 24 * 3600 * 1000)){
            const timeLeftForNextClaim = (1 * 24 * 3600 * 1000) - timeDiff
            const seconds = (timeLeftForNextClaim/1000)%60
            const minutes = (timeLeftForNextClaim/(1000*60))%60
            const hours = (timeLeftForNextClaim/(1000*60*60))%60
            let err = (new Error(`You need to wait ${Math.floor(hours)}h${Math.floor(minutes)}m${Math.floor(seconds)}s before making another claim`)) as any
            err.status = 403
            throw err
        }
      }
      //Add claim in queue in DB for cron job to execute
      const claim: IFaucetClaim = { walletId, processed: false }
      const claimDB = new FaucetClaimModel(claim)
      return await claimDB.save()
    } catch (err) {
      throw err;
    }
  }

  /**
  * Add faucet claim to queue
  * @param walletId - Wallet to give caps to
  * @throws Will throw an error if can't claim yet or db is unreachable
  */
  async processQueue(): Promise<any> {
    try {
      const oldestPendingClaims = await FaucetClaimModel.find({processed: false}).sort({createdAt: -1}).limit(DEFAULT_FAUCET_BATCH_SIZE)
      const oldestPendingClaimsWalletIds = oldestPendingClaims.map(x => x.walletId)
      if (oldestPendingClaimsWalletIds.length>0){
        console.log("number of wallet to process", oldestPendingClaimsWalletIds.length)
        await processFaucetClaims(oldestPendingClaimsWalletIds, this.setClaimsProcessed)
      }else{
        console.log("No batch to process, you can rest now")
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
  * Set claims to processed
  * @param walletId - Wallet to give caps to
  * @throws Will throw an error if can't claim yet or db is unreachable
  */
   async setClaimsProcessed(): Promise<any> {
    try {
      const oldestPendingClaims = await FaucetClaimModel.find({processed: false}).sort({createdAt: -1}).limit(DEFAULT_FAUCET_BATCH_SIZE)
      oldestPendingClaims.forEach(x => x.processed = true)
      Promise.all(oldestPendingClaims.map(x => x.save()))
    } catch (err) {
      console.log(err);
    }
  }
  
}
export default new FaucetClaimService();
