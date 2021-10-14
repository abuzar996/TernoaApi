import FaucetClaimModel from "../models/faucetClaim";
import NFTClaimModel from "../models/NFTClaim";
import { IFaucetClaim } from "../interfaces/IFaucetClaim";
import { INFTClaim } from "../interfaces/INFTClaim";
import { DEFAULT_CAPS_AMOUNT, DEFAULT_FAUCET_BATCH_SIZE } from "../utils";
import { getFaucetBalance, processFaucetClaims, getFaucetNFTs } from "../utils/polka";

export class FaucetClaimService {
  /**
  * Add faucet CAPS claim to queue
  * @param walletId - Wallet to give caps to
  * @throws Will throw an error if can't claim yet or db is unreachable
  */
  async addCAPSClaimToQueue(
    walletId: string,
  ): Promise<any> {
    try {
      const lastClaim = await FaucetClaimModel.findOne({ walletId }).sort({ createdAt: -1 })
      //Check if claim is possible
      if (lastClaim && lastClaim.createdAt) {
        const timeDiff = new Date().getTime() - lastClaim.createdAt.getTime()
        if (timeDiff < (1 * 24 * 3600 * 1000)) {
          const timeLeftForNextClaim = (1 * 24 * 3600 * 1000) - timeDiff
          const seconds = (timeLeftForNextClaim / 1000) % 60
          const minutes = (timeLeftForNextClaim / (1000 * 60)) % 60
          const hours = (timeLeftForNextClaim / (1000 * 60 * 60)) % 60
          let err = (new Error(`You need to wait ${Math.floor(hours)}h${Math.floor(minutes)}m${Math.floor(seconds)}s before making another claim`)) as any
          err.status = 403
          throw err
        }
      }
      const faucetBalance = await getFaucetBalance()
      if (faucetBalance < DEFAULT_CAPS_AMOUNT) {
        let err = (new Error(`All faucet claims have been taken, please come back tomorrow`)) as any
        err.status = 503
        throw err
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
  * Add faucet NFT claim to queue
  * @param walletId - Wallet to give caps to
  * @throws Will throw an error if can't claim yet or db is unreachable
  */
  async addNFTClaimToQueue(
    walletId: string,
    serieId: string,
  ): Promise<any> {
    try {
      const lastClaim = await NFTClaimModel.findOne({ walletId }).sort({ createdAt: -1 })
      //Check if claim is possible
      if (lastClaim) {
        let err = (new Error(`You need have already claimed NFT`)) as any
        err.status = 403
        throw err
      }

      const faucetNFTs = await getFaucetNFTs(serieId)
      if (faucetNFTs.length==0) {
        let err = (new Error(`All NFT claims have been taken`)) as any
        err.status = 503
        throw err
      }
      //Add claim in queue in DB for cron job to execute
      const claim: INFTClaim = { walletId, processed: false, serieId }
      const claimDB = new NFTClaimModel(claim)
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
      const oldestPendingClaims = await FaucetClaimModel.find({ processed: false }).sort({ createdAt: 1 }).limit(DEFAULT_FAUCET_BATCH_SIZE)
      const oldestPendingClaimsWalletIds = oldestPendingClaims.map(x => x.walletId)
      const oldestPendingNFTClaims = await NFTClaimModel.find({ processed: false }).sort({ createdAt: 1 }).limit(DEFAULT_FAUCET_BATCH_SIZE)
      if (oldestPendingClaimsWalletIds.length > 0 || oldestPendingNFTClaims.length > 0) {
        console.log("number of CAPS Claim to process", oldestPendingClaimsWalletIds.length)
        console.log("number of NFT Claim to process", oldestPendingNFTClaims.length)
        await processFaucetClaims(oldestPendingClaimsWalletIds, oldestPendingNFTClaims, this.setClaimsProcessed)
      } else {
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
  async setClaimsProcessed(CAPSClaimAddresses: any, NFTClaimAddress: any): Promise<any> {
    try {
      if(CAPSClaimAddresses.length >0 ){
        const oldestPendingClaims = await FaucetClaimModel.find({$and:[{walletId: {$in:CAPSClaimAddresses}}, {processed: false}]}).sort({ createdAt: 1 }).limit(DEFAULT_FAUCET_BATCH_SIZE)
        oldestPendingClaims.forEach(x => x.processed = true)
        Promise.all(oldestPendingClaims.map(x => x.save()))
      }

      if(NFTClaimAddress.length >0 ){
        const oldestPendingNFTClaims = await NFTClaimModel.find({$and:[{walletId: {$in:NFTClaimAddress}}, {processed: false}]}).sort({ createdAt: 1 }).limit(DEFAULT_FAUCET_BATCH_SIZE)
        oldestPendingNFTClaims.forEach(x => x.processed = true)
        Promise.all(oldestPendingNFTClaims.map(x => x.save()))
      }
     
    } catch (err) {
      console.log(err);
    }
  }

}
export default new FaucetClaimService();
