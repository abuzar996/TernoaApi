import mongoose, {AggregatePaginateModel} from "mongoose";
import { INFTLike } from "../interfaces/INFTLike";
import aggregatePaginate  from "mongoose-aggregate-paginate-v2";

const NFTLike = new mongoose.Schema({
  nftId: {
    type: String,
    index: true,
  },
  serieId: {
    type: String,
    index: true,
  },
  walletId: {
    type: String,
    index: true,
  },
}, { timestamps: true });

NFTLike.plugin(aggregatePaginate);

const NFTLikeModel = mongoose.model<INFTLike & mongoose.Document>("NFTLike", NFTLike) as unknown as AggregatePaginateModel<INFTLike & mongoose.Document>;

export default NFTLikeModel;