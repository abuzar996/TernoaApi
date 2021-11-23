import { NextFunction, Request, Response } from "express";
import fetch from 'node-fetch'
import UserService from "../../services/user";
import { OAuth } from "oauth"
import UserModel from "../../models/user";
import { validationCreateUser, validationGetUser, validationGetUsers, validationLikeUnlike, validationReviewRequested, validationUpdateUser, validationVerifyTwitter, validationVerifyTwitterCallback } from "../../validators/userValidators";

export class Controller {
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<any> {
      try {
          const queryValues = validationGetUsers(req.query)
          const response = await UserService.getUsers(queryValues);
          res.json(response);
      } catch (err) {
          next(err);
      }
  }

  async newUser(req: Request,  res: Response, next: NextFunction): Promise<void> {
      try {
          const queryValues = validationCreateUser(typeof req.body === "string" ? JSON.parse(req.body) : req.body)
          let existingUser = null;
          existingUser = await UserModel.findOne({ walletId: queryValues.walletId });
          if (existingUser) {
              let err = new Error('Wallet user already exists') as any
              err.status=409
              throw err
          } else {
              const user = await UserService.createUser(queryValues);
              console.log("User created : ", queryValues.walletId)
              res.json(user);
          }
      } catch (err) {
        next(err);
      }
  }
  async reviewRequested(req: Request, res: Response, next: NextFunction): Promise<any> {
      try {
          const queryValues = validationReviewRequested(req.params)
          res.json(await UserService.reviewRequested(queryValues))
      } catch (err) {
          next(err);
      }
  }
  
  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
          const queryValues = validationGetUser({...req.params, ...req.query})
          const user = await UserService.findUser(queryValues);
          res.json(user);
      } catch (err) {
          next(err);
      }
  }
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
          console.log({...req.params, ...(typeof req.body === "string" ? JSON.parse(req.body) : req.body)})
          const queryValues = validationUpdateUser({...req.params, ...(typeof req.body === "string" ? JSON.parse(req.body) : req.body)})
          const user = await UserService.updateUser(queryValues);
          res.json(user);
      } catch (err) {
          next(err)
      }
  }

  async likeNft(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queryValues = validationLikeUnlike(req.query)
      res.json(await UserService.likeNft(queryValues));
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
      const queryValues = validationLikeUnlike(req.query)
      res.json(await UserService.unlikeNft(queryValues));
    } catch (err) {
      next(err)
    }
  }
    
  async verifyTwitter(req: Request, res: Response, next: NextFunction): Promise<void>{
      try{
          if (!process.env.TWITTER_CONSUMER_KEY || !process.env.TWITTER_CONSUMER_SECRET) throw new Error("Feature not available")
          const queryValues = validationVerifyTwitter(req.params)
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
              UserService.setTwitterVerificationToken(queryValues.id, oauthToken)
              res.redirect("https://api.twitter.com/oauth/authorize?oauth_token=" + oauthToken)
          })
      }catch(err){
          res.redirect(process.env.TWITTER_REDIRECT_URL+"&twitterValidated=false")
      }
  }

  async verifyTwitterCallback(
    req: Request,
    res: Response
  ): Promise<void>{
    try{
      const queryValues = validationVerifyTwitterCallback(req.query)
      const user = await UserService.getUserByTwitterVerificationToken(queryValues.oauth_token as string)
      const userAccessData = await fetch(`https://api.twitter.com/oauth/access_token?oauth_token=${queryValues.oauth_token}&oauth_verifier=${queryValues.oauth_verifier}`)
      const screenName = new URLSearchParams(await userAccessData.text()).get("screen_name")
      if (screenName !== (user as any).twitterName.substring(1)) throw Error("Couldn't validate twitter username")
      await UserService.validateTwitter(true, user.walletId)
      res.redirect(process.env.TWITTER_REDIRECT_URL+"&twittervalidated=true")
    }catch(err){
      try{
        const queryValues = validationVerifyTwitterCallback(req.query)
        const token = queryValues.oauth_token || queryValues.denied
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
}
export default new Controller();