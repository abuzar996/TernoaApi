import { NextFunction, Request, Response } from "express";
import UserService from "../../services/user";
import { OAuth } from "oauth"


export class Controller {
    async all(_: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const response = await UserService.getAllUsers();
            res.json(response);
        } catch (err) {
            next(err);
        }
    }
    async newUser(req: Request,  res: Response, next: NextFunction): Promise<void> {
        try {
            const { body } = req;
            const { walletId } = body;
            let existingUser = null;
            try {
                existingUser = await UserService.findUser(walletId);
            }
            finally {
                if (existingUser) {
                    res.status(409).send("Wallet user already exists");
                } else {
                    const user = await UserService.createUser(body);
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
            const { walletIds } = req.query
            const user = await UserService.findUsersByWalletId(walletIds as string[]);
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
            const user = await UserService.updateUser(req.params.walletId, req.body);
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
                `${req.headers.host?.substr(0,5)==="local" ? "http://" : "https://"}${req.headers.host}/api/mp/users/verifyTwitter/callback`,
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
}
export default new Controller();