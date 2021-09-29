import { NextFunction, Request, Response } from "express";
import { IMarketplace } from "../../interfaces/IMarketplace";
import MarketplaceModel from "../../models/marketplace";

export class Controller {
    async getMarketplaces(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const marketplaces = await MarketplaceModel.find();
            res.status(200).json({message: "Marketplaces successfully retrieved", marketplaces: marketplaces});
        }catch(err){
            next(err)
        }
    }
    
    async createMarketplace(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const {mpId, name, url, description, logoUrl, salesCommission, type} = req.body
            if (!(mpId && name && url && description && logoUrl && salesCommission && type)){
                let err = new Error('Invalid parameters') as any
                err.status = 400
                return next(err)
            }
            const mp: IMarketplace = {
                mpId: Number(mpId), 
                name, 
                url, 
                description, 
                logoUrl,
                salesCommission,
                type
            }
            const newMP = new MarketplaceModel(mp)
            await newMP.save();
            res.status(200).json({message: "Marketplace successfully created", marketplace: newMP});
        }catch(err){
            next(err)
        }
    }

    async getMarketplace(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const { mpId } = req.params
            const marketplace = await MarketplaceModel.findOne({mpId: Number(mpId)});
            if (!marketplace) throw new Error(`Marketplace not foud with mpId : ${mpId}`)
            res.status(200).json({message: "Marketplace successfully retrieved", marketplace: marketplace});
        }catch(err){
            next(err)
        }
    }

    async updateMarketplace(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const { mpId } = req.params
            const { name, url, description, logoUrl, salesCommission, type} = req.body
            const marketplace = await MarketplaceModel.findOne({mpId: Number(mpId)});
            if (!marketplace) throw new Error(`Marketplace not foud with mpId : ${mpId}`)
            if (name !== undefined) marketplace.name = name
            if (url !== undefined) marketplace.url = url
            if (description !== undefined) marketplace.description = description
            if (logoUrl !== undefined) marketplace.logoUrl = logoUrl
            if (salesCommission !== undefined) marketplace.salesCommission = salesCommission
            if (type !== undefined) marketplace.type = type
            await marketplace.save()
            res.status(200).json({message: "Marketplace successfully updated", marketplace: marketplace});
        }catch(err){
            next(err)
        }
    }
}
export default new Controller();