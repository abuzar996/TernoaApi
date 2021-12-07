import { NextFunction, Request, Response } from "express";
import NFTLikeModel from "../../models/NFTLike";
import { LIMIT_MAX_PAGINATION } from "../../utils";
import { validationGetLikes } from "../../validators/nftLikesValidator";

export class Controller {
    async getLikes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const queryValues = validationGetLikes(req.query)
            const aggregates: any[] = []
            if (queryValues.filter?.seriesIds){
                aggregates.push({
                    $match: {serieId: {$in: queryValues.filter.seriesIds}}
                })
            }
            aggregates.push({$group: {_id: "$serieId", count: {$sum:1}}})
            aggregates.push({ $sort : { count : (queryValues.sort === "asc" ? 1 : -1)}})
            const likesAggregate = NFTLikeModel.aggregate(aggregates)
            const likesRanking = await NFTLikeModel.aggregatePaginate(
                likesAggregate,
                {
                    page: queryValues.pagination?.page ? queryValues.pagination.page : 1,
                    limit: queryValues.pagination?.limit ? queryValues.pagination.limit : LIMIT_MAX_PAGINATION,
                }
            )
            res.status(200).json({message: "NFT Likes retreived", likesRanking});
        }catch(err){
            next(err)
        }
    }
}
export default new Controller();