import { NextFunction, Request, Response } from "express";
import { IMarketplace } from "../../interfaces/IMarketplace";
import MarketplaceModel from "../../models/marketplace";
import { validationCreateMarketplace, validationGetMarketplace, validationUpdateMarketplace } from "../../validators/marketplaceValidators";

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
            const queryValues = validationCreateMarketplace(req.body)
            const mp: IMarketplace = {
                mpId: queryValues.mdId, 
                name: queryValues.name, 
                url: queryValues.url, 
                description: queryValues.description, 
                logoUrl: queryValues.logoUrl,
                salesCommission: queryValues.salesCommission,
                type: queryValues.type
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
            const queryValues = validationGetMarketplace(req.params)
            const marketplace = await MarketplaceModel.findOne({mpId: queryValues.mdId});
            if (!marketplace) throw new Error(`Marketplace not foud with mpId : ${queryValues.mdId}`)
            res.status(200).json({message: "Marketplace successfully retrieved", marketplace: marketplace});
        }catch(err){
            next(err)
        }
    }

    async updateMarketplace(req: Request, res: Response, next: NextFunction): Promise<void> {
        try{
            const { mpId } = req.params
            const { name, url, description, logoUrl, salesCommission, type} = req.body
            const queryValues = validationUpdateMarketplace({ mpId, ...req.body})
            const marketplace = await MarketplaceModel.findOne({mpId: queryValues.mdId});
            if (!marketplace) throw new Error(`Marketplace not foud with mpId : ${queryValues.mdId}`)
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