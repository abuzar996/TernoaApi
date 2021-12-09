
import Joi from "joi";
import { validateQuery } from ".";

export type updateWhitelistSignatureQuery = {
    ethAddress: string
    walletId: string
    signature: string
}
export const validationUpdateWhitelistSignature = (query: any) => {
    const validationSchema = Joi.object({
        ethAddress: Joi.string().required(),
        walletId: Joi.string().required(),
        signature: Joi.string().required(),
    });
    return validateQuery(validationSchema, query) as updateWhitelistSignatureQuery;
};

export type getWhitelistSignatureQuery = {
    ethAddress: string
}
export const validationGetWhitelistSignature = (query: any) => {
    const validationSchema = Joi.object({
        ethAddress: Joi.string().required(),
    });
    return validateQuery(validationSchema, query) as getWhitelistSignatureQuery;
};