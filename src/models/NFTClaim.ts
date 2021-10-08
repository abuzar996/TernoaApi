import mongoose from "mongoose";
import { INFTClaim } from "../interfaces/INFTClaim";

const NFTClaim = new mongoose.Schema({
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

const NFTClaimModel = mongoose.model<INFTClaim & mongoose.Document>("NFTClaim", NFTClaim);
export default NFTClaimModel;
