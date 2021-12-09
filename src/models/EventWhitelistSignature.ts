import mongoose from "mongoose";
import { IEventWhitelistSignature } from "../interfaces/IEventWhitelistSignature";

const EventWhitelistSignature = new mongoose.Schema({
  ethAddress: {
    type: String,
    required: true,
    unique: true,
  },
  eventNumber:{
    type: Number,
  },
  walletId: {
    type: String,
  },
  signature: {
    type: String,
  },
}, { timestamps: true });


const EventWhitelistSignatureModel = mongoose.model<IEventWhitelistSignature & mongoose.Document>("EventWhitelistSignature", EventWhitelistSignature);

export default EventWhitelistSignatureModel;