import Joi from "joi";
import { validateQuery } from ".";

export type createMarketplaceQuery = {
    mpId: number,
    name: string,
    url: string,
    description: string,
    logoUrl: string,
    salesCommission: string,
    type: string
}
export const validationCreateMarketplace = (query: any) => {
    const validationSchema = Joi.object({
        mpId: Joi.number().required(),
        name: Joi.string().required(),
        url: Joi.string().uri().required(),
        description: Joi.string().required(),
        logoUrl: Joi.string().uri().required(),
        salesCommission: Joi.string().required(),
        type: Joi.string().required(),
    });
    return validateQuery(validationSchema, query) as createMarketplaceQuery;
};


export type getMarketplaceQuery = {
    mpId: number,
}
export const validationGetMarketplace = (query: any) => {
    const validationSchema = Joi.object({
        mpId: Joi.number().required(),
    });
    return validateQuery(validationSchema, query) as getMarketplaceQuery;
};


export type updateMarketplaceQuery = {
    mpId: number,
    name?: string,
    url?: string,
    description?: string,
    logoUrl?: string,
    salesCommission?: string,
    type?: string
}
export const validationUpdateMarketplace = (query: any) => {
    const validationSchema = Joi.object({
        mpId: Joi.number().required(),
        name: Joi.string(),
        url: Joi.string().uri(),
        description: Joi.string(),
        logoUrl: Joi.string().uri(),
        salesCommission: Joi.string(),
        type: Joi.string(),
    });
    return validateQuery(validationSchema, query) as updateMarketplaceQuery;
};
