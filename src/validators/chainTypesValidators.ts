
import Joi from "joi";
import { validateQuery } from ".";

export type getChainTypesQuery = {
    chain?: string
}
export const validationGetChainTypes = (query: any) => {
    const validationSchema = Joi.object({
        chain: Joi.string()
    });
    return validateQuery(validationSchema, query) as getChainTypesQuery;
};
