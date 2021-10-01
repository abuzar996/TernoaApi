import mongoose from "mongoose";
import { IFaucetClaim } from "../interfaces/IFaucetClaim";

const FaucetClaim = new mongoose.Schema({
  walletId: {
    type: String,
    index: true,
    minlength: 48,
    maxlength: 48,
  },
  processed: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

const FaucetClaimModel = mongoose.model<IFaucetClaim & mongoose.Document>("FaucetClaim", FaucetClaim);
export default FaucetClaimModel;
