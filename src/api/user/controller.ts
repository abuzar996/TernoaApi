import { NextFunction, Request, Response } from "express";
import fetch from 'node-fetch'
import UserService from "../../services/user";
import { OAuth } from "oauth"
import { LIMIT_MAX_PAGINATION } from "../../utils";
import UserModel from "../../models/user";

export class Controller {
    async all(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const {page, limit} = req.query
            if (page && page !== "undefined" && (isNaN(Number(page)) || Number(page) < 1)) throw new Error("Page argument is invalid")
            if (limit && page !== "undefined" && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > LIMIT_MAX_PAGINATION)) throw new Error("Limit argument is invalid")
            if (page && limit && page !== "undefined" && limit !== "undefined"){
                const response = await UserService.getAllUsers(Number(page), Number(limit));
                res.json(response);
            }else{
                const response = await UserService.getAllUsers();
                res.json(response);
            }
        } catch (err) {
            next(err);
        }
    }
    async newUser(req: Request,  res: Response, next: NextFunction): Promise<void> {
        try {
            const { body } = req;
            const { walletId } = JSON.parse(body);
            console.log(walletId)
            let existingUser = null;
            try {
                existingUser = await UserModel.findOne({ walletId });;
            }finally {
                console.log(walletId)
                console.log(existingUser)
                if (existingUser) {
                    let err = new Error('Wallet user already exists') as any
                    err.status=409
                    next(err)
                } else {
                    const user = await UserService.createUser({ walletId });
                    res.json(user);
                }
            }
        } catch (err) {
          next(err);
        }
    }
    async reviewRequested(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const user = await UserService.reviewRequested(req.params.id);
            res.json(user);
        } catch (err) {
            next(err);
        }
    }
    async getUsersBywalletId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { walletIds, query, page, limit } = req.query
            if (page && page !== "undefined" && (isNaN(Number(page)) || Number(page) < 1)) throw new Error("Page argument is invalid")
            if (limit && page !== "undefined" && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > LIMIT_MAX_PAGINATION)) throw new Error("Limit argument is invalid")
            const user = await UserService.findUsersByWalletId(walletIds as string[], query, Number(page), Number(limit));
            res.json(user);
        } catch (err) {
            next(err);
        }
    }
    async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params
            const user = await UserService.findUser(id);
            res.json(user);
        } catch (err) {
            next(err);
        }
    }
    async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.params.walletId || !req.body) throw new Error("invalid wallet id or parameters")
            const jsonBody = JSON.parse(req.body)
            const user = await UserService.updateUser(req.params.walletId, jsonBody);
            res.json(user);
        } catch (err) {
            next(err)
        }
    }
      
    async verifyTwitter(req: Request, res: Response, next: NextFunction): Promise<void>{
        try{
            if (!process.env.TWITTER_CONSUMER_KEY || !process.env.TWITTER_CONSUMER_SECRET) throw new Error("Feature not available")
            if (!req.params.id) throw new Error("User wallet id not given")
            const oauth = new OAuth(
                'https://api.twitter.com/oauth/request_token',
                'https://api.twitter.com/oauth/access_token',
                process.env.TWITTER_CONSUMER_KEY,
                process.env.TWITTER_CONSUMER_SECRET,
                '1.0A',
                `${req.headers.host?.substr(0,5)==="local" ? "http://" : "https://"}${req.headers.host}/api/users/verifyTwitter/callback`,
                'HMAC-SHA1'
            )
            oauth.getOAuthRequestToken((err, oauthToken) => {
                if (err) throw new Error(err.statusCode + ': ' + err.data)
                UserService.setTwitterVerificationToken(req.params.id, oauthToken)
                res.redirect("https://api.twitter.com/oauth/authorize?oauth_token=" + oauthToken)
            })
        }catch(err){
            res.redirect(process.env.TWITTER_REDIRECT_URL+"&twitterValidated=false")
        }
    }

  async verifyTwitterCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>{
    try{
      if (!req.query.oauth_token || !req.query.oauth_verifier) throw new Error("Couldn't validate twitter username")
      const user = await UserService.getUserByTwitterVerificationToken(req.query.oauth_token as string)
      const userAccessData = await fetch(`https://api.twitter.com/oauth/access_token?oauth_token=${req.query.oauth_token}&oauth_verifier=${req.query.oauth_verifier}`)
      const screenName = new URLSearchParams(await userAccessData.text()).get("screen_name")
      if (screenName !== (user as any).twitterName.substring(1)) throw Error("Couldn't validate twitter username")
      await UserService.validateTwitter(true, user.walletId)
      res.redirect(process.env.TWITTER_REDIRECT_URL+"&twittervalidated=true")
    }catch(err){
      try{
        const token = req.query.oauth_token || req.query.denied
        if (token){
          const user = await UserService.getUserByTwitterVerificationToken(token as string)
          await UserService.validateTwitter(false, user.walletId)
        }
      }catch(errMongo){
        res.redirect(process.env.TWITTER_REDIRECT_URL+"&twitterValidated=false")
      }
      res.redirect(process.env.TWITTER_REDIRECT_URL+"&twitterValidated=false")
    }
  }

  async likeNft(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { walletId, nftId, serieId } = req.query
      if (!walletId || !nftId || !serieId) throw new Error("wallet id or nft id not given")
      const user = await UserService.likeNft(walletId as string, nftId as string, serieId as string);
      res.json(user);
    } catch (err) {
      next(err)
    }
  }

  async unlikeNft(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { walletId, nftId, serieId } = req.query
      if (!walletId || !nftId || !serieId) throw new Error("wallet id or nft id not given")
      const user = await UserService.unlikeNft(walletId as string, nftId as string, serieId as string);
      res.json(user);
    } catch (err) {
      next(err)
    }
  }
}
export default new Controller();