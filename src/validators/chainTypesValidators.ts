
import Joi from "joi";
import { validateQuery } from ".";

export type getChainTypesQuery = {
    specVersion?: string
}
export const validationGetChainTypes = (query: any) => {
    const validationSchema = Joi.object({
        specVersion: Joi.number()
    });
    return validateQuery(validationSchema, query) as getChainTypesQuery;
};

export type getLastBlockForSpecVersionQuery = {
    specVersion: string
}
export const validationGetLastBlockForSpecVersion = (query: any) => {
    const validationSchema = Joi.object({
        specVersion: Joi.number().required()
    });
    return validateQuery(validationSchema, query) as getLastBlockForSpecVersionQuery;
};


