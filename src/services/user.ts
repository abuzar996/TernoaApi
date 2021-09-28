import crypto from "crypto";
import { PaginateResult } from "mongoose";
import { IUser, IUserDTO } from "../interfaces/IUser";
import UserModel from "../models/user";
import { isValidSignature, validateUrl, validateTwitter } from "../utils";
import { CustomResponse } from "../interfaces/ICustomResponse";

export class UserService {
  /**
   * Returns all users with pagination
   * @param page - Page number
   * @param limit - Number of users per page
   * @throws Will throw an error if can't fetch users
   */
  async getAllUsers(
    page: number = 1,
    limit: number = 15
  ): Promise<CustomResponse<IUser>> {
    try {
      const res:PaginateResult<IUser>  = await UserModel.paginate({ artist: true }, { page, limit });
      const response: CustomResponse<IUser> = {
        totalCount: res.totalDocs,
        data: res.docs,
        hasNextPage: res.hasNextPage,
        hasPreviousPage: res.hasNextPage
      }
      return response
    } catch (err) {
      throw new Error("Users can't be fetched");
    }
  }

  /**
   * Creates a new user in DB
   * @param userDTO - User data
   * @throws Will throw an error if can't create user
   */
  async createUser(userDTO: IUserDTO): Promise<IUser> {
    const nonce = crypto.randomBytes(16).toString("base64");
    try {
      const newUser = new UserModel({ ...userDTO, nonce });
      return await newUser.save();
    } catch (err) {
      throw new Error("User can't be created");
    }
  }


  /**
   * Creates a new user in DB
   * @param walletId - wallet Id
   * @throws Will throw an error if can't create user
   */
   async reviewRequested(walletId: string): Promise<any> {
    try {
      return UserModel.findOneAndUpdate({walletId}, {reviewRequested: true}, { new: true });
    } catch (err) {
      throw new Error("User can't be updated");
    }
  }

  /**
   * Finds a user in DB
   * @param walletId - User's wallet ID
   * @param incViews - Should increase views counter
   * @param ignoreCache - Should fetch directly from database and ignore cache
   * @throws Will throw an error if wallet ID doesn't exist
   */
  async findUser(
    walletId: string,
  ): Promise<IUser> {
    try {
      const user = await UserModel.findOne({ walletId });
      if (!user) throw new Error();
      return user
    } catch (err) {
      throw new Error(err + ": User can't be found");
    }
  }

  /**
   * Finds multiple users in DB
   * @param wallet ids - An array of users wallet ids
   * @throws Will throw an error if DB can't be reached
   * @return A promise that resolves to the users
   */
  async findUsersByWalletId(walletIds?: string[], query?: any, page?: number, limit?: number): Promise<CustomResponse<IUser>> {
    try {
      if (!walletIds && !query) throw new Error('Invalid parameters')
      if (page && limit){
        const res: PaginateResult<IUser> = await UserModel.paginate(
          !query ? { walletId: { $in: walletIds } } : JSON.parse(query),
          {
            page, 
            limit
          }
        )
        const response: CustomResponse<IUser> = {
          totalCount: res.totalDocs,
          data: res.docs,
          hasNextPage: res.hasNextPage,
          hasPreviousPage: res.hasNextPage
        }
        return response;
      }else{
        const res = await UserModel.find(!query ? { walletId: { $in: walletIds } } : JSON.parse(query));
        const response: CustomResponse<IUser> = {
          totalCount: res.length,
          data: res,
        }
        return response;
      }
    } catch (err) {
      throw new Error("Users can't be found");
    }
  }

  /**
   * verify signature and update the user
   * @param walletId - User's public address
   * @param walletData - User's data for update
   * @throws Will throw an error if signature is invalid or if user can't be found in db
   * @return A promise of updated user
   */
  async updateUser(walletId: string, walletData: any): Promise<IUser> {
    try{
      const data = JSON.parse(walletData.data)
      try{
        if (!isValidSignature(walletData.data, walletData.signedMessage, data.walletId)) throw new Error("Invalid signature")
      }catch(err){
        throw new Error("Invalid signature")
      }
      let isError=false
      const {name, customUrl, bio, twitterName, personalUrl, picture, banner} = data
      if (typeof name !== "string" || name.length===0) isError=true
      if (customUrl && (typeof customUrl !== "string" || !validateUrl(customUrl))) isError=true
      if (bio && typeof bio !== "string") isError=true
      if (twitterName && (typeof twitterName !== "string" || !validateTwitter(twitterName))) isError=true
      if (personalUrl && (typeof personalUrl !== "string" || !validateUrl(personalUrl))) isError=true
      if (picture && (typeof picture !== "string" || !validateUrl(picture))) isError=true
      if (banner && (typeof banner !== "string" || !validateUrl(banner))) isError=true
      if (isError) throw new Error("Couldn't update user")
      const userOld = await UserModel.findOne({walletId})
      if (!userOld) throw new Error('User not found in db')
      let twitterVerified = userOld.twitterVerified
      if (userOld.twitterName !== twitterName) twitterVerified = false
      const user = await UserModel.findOneAndUpdate(
        { walletId },
        {name, customUrl, bio, twitterName, personalUrl, picture, banner, twitterVerified},
        {new: true}
      );
      return user
    }catch(err){
      throw err
    }
  }

  /**
   * store temporary oauth twitter token to validate user
   * @param walletId - wallet Id
   * @param oauthToken - Oauth token
   * @throws Will throw an error if db can't be reached
   */
   async setTwitterVerificationToken(walletId: string, oauthToken: string): Promise<void> {
    try{
      await UserModel.findOneAndUpdate(
        { walletId },
        {twitterVerificationToken: oauthToken}
      );
    }catch(err){
      throw err
    }
  }

  /**
   * Get's the user by oauth verification token
   * @param oauthToken - Oauth token
   * @throws Will throw an error if db can't be reached
   */
   async getUserByTwitterVerificationToken(oauthToken: string): Promise<IUser> {
    try{
      const user = await UserModel.findOne({ twitterVerificationToken: oauthToken })
      if (!user) throw new Error('User not found with oauth token')
      return user;
    }catch(err){
      throw err
    }
  }

  /**
   * Validate the twitter username
   * @param isValid - if his twitter name matches the one entered in profile page
   * @param walletId - wallet id
   * @throws Will throw an error if db can't be reached
   */
    async validateTwitter(isValid: boolean, walletId: string): Promise<void> {
    try{
        await UserModel.findOneAndUpdate(
          { walletId },
          { twitterVerificationToken: '',twitterVerified: isValid }
        );
    }catch(err){
      throw err
    }
  }

  /**
   * Like an NFT
   * @param walletId - wallet Id
   * @param nftId - nft Id
   * @throws Will throw an error if already liked or if db can't be reached
   */
   async likeNft(walletId: string, nftId: string, serieId: string): Promise<IUser> {
    try {
      const user  = await UserModel.findOne({walletId});
      const key = {serieId, nftId}
      if (!user) throw new Error()
      if (user.likedNFTs){
        if (serieId === "0"){
          if (user.likedNFTs.map(x => x.nftId).includes(key.nftId)) throw new Error("NFT already liked")
        }else{
          if (user.likedNFTs.map(x => x.serieId).includes(key.serieId)) throw new Error("NFT already liked")
        }
        user.likedNFTs.push(key)
      }else{
        user.likedNFTs= [key]
      }
      await user.save()
      return user
    } catch (err) {
      throw new Error("Couldn't like NFT");
    }
  }

  /**
   * Unlike an NFT
   * @param walletId - wallet Id
   * @param nftId - nft Id
   * @throws Will throw an error if already liked or if db can't be reached
   */
   async unlikeNft(walletId: string, nftId: string, serieId: string): Promise<IUser> {
    try {
      const user  = await UserModel.findOne({walletId});
      const key = {serieId, nftId}
      if (!user || !user.likedNFTs) throw new Error()
      if (serieId === "0"){
        if (!user.likedNFTs.map(x => x.nftId).includes(key.nftId)) throw new Error("NFT already not liked")
        user.likedNFTs = user.likedNFTs.filter(x => x.nftId !== key.nftId)
      }else{
        if (!user.likedNFTs.map(x => x.serieId).includes(key.serieId)) throw new Error("NFT already not liked")
        user.likedNFTs = user.likedNFTs.filter(x => x.serieId !== key.serieId)
      }
      await user.save()
      return user
    } catch (err) {
      throw new Error("Couldn't unlike NFT");
    }
  }
}

export default new UserService();
