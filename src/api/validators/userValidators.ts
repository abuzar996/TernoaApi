import Joi from "joi";
import { validateQuery } from ".";
import { LIMIT_MAX_PAGINATION } from "../../utils";

export type getUsersQuery = {
    filter?: {
        walletIds?: string[]
        artist?: boolean
        verified?: boolean
        searchText?: string
    },
    pagination?: {
        page?: number
        limit?: number
    }
}
export const validationGetUsers = (query: any) => {
    let { pagination, filter } = query;
    if (pagination) pagination = JSON.parse(pagination)
    if (filter) filter = JSON.parse(filter)
    const validationSchema = Joi.object({
        filter: Joi.object({
            walletIds: Joi.array().items(Joi.string()),
            artist: Joi.boolean(),
            verified: Joi.boolean(),
            searchText: Joi.string()
        }),
        pagination: Joi.object({
            page: Joi.number().integer().min(0),
            limit: Joi.number().integer().min(0).max(LIMIT_MAX_PAGINATION),
        }),
    });
    return validateQuery(validationSchema, { pagination, filter }) as getUsersQuery;
};


export type reviewRequestedQuery = {
    walletId: string,
}
export const validationReviewRequested = (query: any) => {
    const validationSchema = Joi.object({
        walletId: Joi.string().required(),
    });
    return validateQuery(validationSchema, query) as reviewRequestedQuery;
};


export type createUserQuery = {
    walletId: string,
}
export const validationCreateUser = (query: any) => {
    const validationSchema = Joi.object({
        walletId: Joi.string().required(),
    });
    return validateQuery(validationSchema, query) as createUserQuery;
};


export type getUserQuery = {
    id: string,
    removeBurned?: boolean
}
export const validationGetUser = (query: any) => {
    const validationSchema = Joi.object({
        id: Joi.string().required(),
        removeBurned: Joi.boolean(),
    });
    return validateQuery(validationSchema, query) as getUserQuery;
};


export type updateUserQuery = {
    walletId: string
    signedMessage: string
    data: {
        walletId: string,
        name: string,
        customUrl?: string
        bio?: string
        twitterName?: string
        personalUrl?: string
        picture?: string
        banner?: string
    }
}
export const validationUpdateUser = (query: any) => {
    const validationSchema = Joi.object({
        walletId: Joi.string().required(),
        signedMessage: Joi.string().required(),
        data: Joi.object({
            walletId: Joi.string().required(),
            name: Joi.string().required(),
            customUrl: Joi.string().uri(),
            bio: Joi.string(),
            twitterName: Joi.string().regex(/^@[a-zA-Z0-9_]/),
            personalUrl: Joi.string().uri(),
            picture: Joi.string().uri(),
            banner: Joi.string().uri(),
        })

    });
    return validateQuery(validationSchema, query) as updateUserQuery;
};


export type likeUnlikeQuery = {
    walletId: string,
    nftId: string, 
    serieId: string,
}
export const validationLikeUnlike = (query: any) => {
    const validationSchema = Joi.object({
        walletId: Joi.string().required(),
        nftId: Joi.string().required(),
        serieId: Joi.string().required(),
    });
    return validateQuery(validationSchema, query) as likeUnlikeQuery;
};


export type verifyTwitterQuery = {
    id: string,
}
export const validationVerifyTwitter = (query: any) => {
    const validationSchema = Joi.object({
        id: Joi.string().required(),
    });
    return validateQuery(validationSchema, query) as verifyTwitterQuery;
};


export type verifyTwitterCallbackQuery = {
    oauth_token: string,
    oauth_verifier: string,
    denied?: string
}
export const validationVerifyTwitterCallback = (query: any) => {
    const validationSchema = Joi.object({
        oauth_token: Joi.string().required(),
        oauth_verifier: Joi.string().required(),
        denied: Joi.string(),
    });
    return validateQuery(validationSchema, query) as verifyTwitterCallbackQuery;
};



