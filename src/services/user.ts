import crypto from "crypto";
import { PaginateResult } from "mongoose";
import fetch from 'node-fetch'
import { IUser } from "../interfaces/IUser";
import UserModel from "../models/user";
import { isValidSignature, LIMIT_MAX_PAGINATION } from "../utils";
import { CustomResponse } from "../interfaces/ICustomResponse";
import { createUserQuery, getUserQuery, getUsersQuery, likeUnlikeQuery, reviewRequestedQuery, updateUserQuery } from "../validators/userValidators";

export class UserService {
  /**
   * Returns users with pagination and selected filters
   * @param query - see getUsersQuery
   * @param limit - Number of users per page
   * @throws Will throw an error if can't fetch users
   */
  async getUsers(
    query: getUsersQuery,
  ): Promise<CustomResponse<IUser>> {
    try {
      const pagination  = {
        page: query.pagination?.page ? query.pagination.page : 1,
        limit: query.pagination?.limit ? query.pagination.limit : LIMIT_MAX_PAGINATION
      }
      let mongoFilter: any = {$and: []}
      if (query.filter){
        if (query.filter.walletIds) mongoFilter.$and.push({ walletId: { $in: query.filter.walletIds }})
        if (query.filter.artist !== undefined) mongoFilter.$and.push({ artist: query.filter.artist})
        if (query.filter.verified !== undefined) mongoFilter.$and.push({ verified: query.filter.verified})
        if (query.filter.searchText !== undefined) mongoFilter.$and.push({ 
          $or: [
            {name: {$regex: query.filter.searchText, $options: "i"}}, 
            {walletId: {$regex: query.filter.searchText, $options: "i"}}
          ]
        })
      }
      if (mongoFilter.$and.length === 0) mongoFilter = {}
      const res:PaginateResult<IUser>  = await UserModel.paginate(mongoFilter, pagination);
      const response: CustomResponse<IUser> = {
        totalCount: res.totalDocs,
        data: res.docs,
        hasNextPage: res.hasNextPage,
        hasPreviousPage: res.hasNextPage
      }
      return response
    } catch (err) {
      throw new Error("Users can't be found");
    }
  }

  /**
   * Creates a new user in DB
   * @param query - see createUserQuery
   * @throws Will throw an error if can't create user
   */
  async createUser(query: createUserQuery): Promise<IUser> {
    const nonce = crypto.randomBytes(16).toString("base64");
    try {
      const newUser = new UserModel({ walletId: query.walletId, nonce });
      return await newUser.save();
    } catch (err) {
      throw new Error("User can't be created");
    }
  }


  /**
   * Creates a new user in DB
   * @param query - see reviewRequestedQuery
   * @throws Will throw an error if can't create user
   */
   async reviewRequested(query: reviewRequestedQuery): Promise<any> {
    try {
      return UserModel.findOneAndUpdate({walletId: query.id}, {reviewRequested: true}, { new: true });
    } catch (err) {
      throw new Error("User can't be updated");
    }
  }

  /**
   * Finds a user in DB
   * @param query - see getUserQuery
   * @throws Will throw an error if wallet ID doesn't exist
   */
  async findUser(
    query: getUserQuery,
  ): Promise<IUser> {
    try {
      let user = await UserModel.findOne({ walletId: query.id }) as IUser; 
      if (!user) throw new Error();
      if (query.removeBurned){
        user = await this.removeBurnedNFTsFromLikes(user)
      }
      return user
    } catch (err) {
      console.log(err)
      throw new Error("User can't be found");
    }
  }

  async removeBurnedNFTsFromLikes(user: IUser): Promise<IUser>{
    try{
      let returnUser = user
      if (user.likedNFTs && user.likedNFTs.length > 0){
        const json={
          operationName:"Query",
          variables:{},
          query:`query Query{
            nftEntities(filter: { 
              and : [
                {timestampBurn:{isNull:true}}
                {id: {in: [${user.likedNFTs.map(x => `"${x.nftId}"`).join(',')}]}}
              ]
            } 
            orderBy:CREATED_AT_ASC ){
              totalCount
              nodes{
                id
              }
            }
          }`
        }
        const GQLRes = await fetch(`${process.env.INDEXER_URL}/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body:JSON.stringify(json)
        });
        const res = await GQLRes.json()
        if(res && res.data && res.data.nftEntities && user.likedNFTs.length !== res.data.nftEntities.totalCount){
          const nonBurnedNFTs: any[] = res.data.nftEntities.nodes
          const newLikedArray = user.likedNFTs.filter(x => nonBurnedNFTs.findIndex(y => y.id === x.nftId) !== -1)
          const updatedUser = await UserModel.findOneAndUpdate({ walletId: user.walletId }, { likedNFTs: newLikedArray }, { new: true })
          if (updatedUser) returnUser = updatedUser
        }
      }
      return returnUser
    }catch(err){
      console.log(err)
      return user
    }
  }

  /**
   * verify signature and update the user
   * @param query - see updateUserQuery
   * @throws Will throw an error if signature is invalid or if user can't be found in db
   * @return A promise of updated user
   */
  async updateUser(query: updateUserQuery): Promise<IUser> {
    try{
      try{
        if (!isValidSignature(JSON.stringify(query.data), query.signedMessage, query.data.walletId)) throw new Error("Invalid signature")
      }catch(err){
        throw new Error("Invalid signature")
      }
      const {name, customUrl, bio, twitterName, personalUrl, picture, banner} = query.data
      const userOld = await UserModel.findOne({walletId: query.data.walletId})
      if (!userOld) throw new Error('User not found in db')
      let twitterVerified = userOld.twitterVerified
      if (userOld.twitterName !== twitterName) twitterVerified = false
      const user = await UserModel.findOneAndUpdate(
        { walletId: query.data.walletId },
        {name, customUrl, bio, twitterName, personalUrl, picture, banner, twitterVerified},
        {new: true}
      );
      if (!user) throw new Error("An error has occured while update, please try again")
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
   * @param query - see likeUnlikeQuery
   * @param nftId - nft Id
   * @throws Will throw an error if already liked or if db can't be reached
   */
   async likeNft(query: likeUnlikeQuery): Promise<IUser> {
    try {
      const user  = await UserModel.findOne({walletId: query.walletId});
      const key = {serieId: query.serieId, nftId: query.nftId}
      if (!user) throw new Error()
      const likedArray = user.likedNFTs || []
      if (likedArray){
        if (query.serieId === "0"){
          if (likedArray.map(x => x.nftId).includes(key.nftId)) throw new Error("NFT already liked")
        }else{
          if (likedArray.map(x => x.serieId).includes(key.serieId)) throw new Error("NFT already liked")
        }
      }
      likedArray.push(key)
      const newUser = await UserModel.findOneAndUpdate({walletId: query.walletId}, {likedNFTs: likedArray},{new: true})
      if (!newUser) throw new Error("An error has occured while liking an NFT, please try again")
      return newUser
    } catch (err) {
      throw new Error("Couldn't like NFT");
    }
  }

  /**
   * Unlike an NFT
   * @param query - see likeUnlikeQuery
   * @throws Will throw an error if already liked or if db can't be reached
   */
   async unlikeNft(query: likeUnlikeQuery): Promise<IUser> {
    try {
      const user  = await UserModel.findOne({walletId: query.walletId});
      const key = {serieId: query.serieId, nftId: query.nftId}
      if (!user || !user.likedNFTs) throw new Error()
      let likedArray = user.likedNFTs
      if (query.serieId === "0"){
        if (!likedArray.map(x => x.nftId).includes(key.nftId)) throw new Error("NFT already not liked")
        likedArray = likedArray.filter(x => x.nftId !== key.nftId)
      }else{
        if (!likedArray.map(x => x.serieId).includes(key.serieId)) throw new Error("NFT already not liked")
        likedArray = likedArray.filter(x => x.serieId !== key.serieId)
      }
      const newUser = await UserModel.findOneAndUpdate({walletId: query.walletId}, {likedNFTs: likedArray},{new: true})
      if (!newUser) throw new Error("An error has occured while unliking an NFT, please try again")
      return newUser
    } catch (err) {
      throw new Error("Couldn't unlike NFT");
    }
  }
}

export default new UserService();
