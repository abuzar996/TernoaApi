import mongoose from "mongoose";
import { IMarketplace } from "../interfaces/IMarketplace";

const Marketplace = new mongoose.Schema({
  mpId: {
    type: Number,
  },
  name: {
    type: String,
  },
  url: {
    type: String,
  },
  description: {
    type: String,
  },
  logoUrl: {
    type: String,
  },
  salesCommission: {
    type: String,
  },
  type: {
    type: String,
  },
}, { timestamps: true });

const MarketplaceModel = mongoose.model<IMarketplace & mongoose.Document>("Marketplace", Marketplace);
export default MarketplaceModel;
