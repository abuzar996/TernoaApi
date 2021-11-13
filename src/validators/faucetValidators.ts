import Joi from "joi";
import { validateQuery } from ".";

export type claimTestCapsQuery = {
    walletId: string
}
export const validationClaimTestCaps = (query: any) => {
    const validationSchema = Joi.object({
        walletId: Joi.string().required()
    });
    return validateQuery(validationSchema, query) as claimTestCapsQuery;
};

export type claimTestNFTQuery = {
    walletId: string
    qrId?: number
}
export const validationClaimTestNFT = (query: any) => {
    const validationSchema = Joi.object({
        walletId: Joi.string().required(),
        qrId: Joi.number().min(0)
    });
    return validateQuery(validationSchema, query) as claimTestNFTQuery;
};