import Joi from "joi";
import { validateQuery } from ".";

export type getLikesQuery = {
    filter?:{
        seriesIds?: string[],
    },
    pagination?:{
        page?: number,
        limit?: number,
    },
    sort?:string
}
export const validationGetLikes = (query: any) => {
    let pagination = query.pagination
    let filter = query.filter
    const sort = query.sort
    if (pagination) pagination = JSON.parse(pagination)
    if (filter) filter = JSON.parse(filter)
    const validationSchema = Joi.object({
        filter: Joi.object({
            seriesIds: Joi.array().items(Joi.string()),
        }),
        pagination: Joi.object({
            page: Joi.number(),
            limit: Joi.number()
        }),
        sort: Joi.string()
    });
    return validateQuery(validationSchema, {filter, pagination, sort}) as getLikesQuery;
};