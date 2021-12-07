import crypto from "crypto";
import { PaginateResult } from "mongoose";
import { IUser } from "../interfaces/IUser";
import UserModel from "../models/user";
import { isValidSignature, LIMIT_MAX_PAGINATION } from "../utils";
import { CustomResponse } from "../interfaces/ICustomResponse";
import { createUserQuery, getUserQuery, getUsersQuery, likeUnlikeQuery, reviewRequestedQuery, updateUserQuery } from "../validators/userValidators";
import NFTLikeModel from "../models/NFTLike";
import { INFTLike } from "../interfaces/INFTLike";
import * as fs from 'fs'
import fetch from "node-fetch";

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
      if (query.populateLikes){
        const likedNFTs = await NFTLikeModel.find({walletId: {$in: res.docs.map(x => x.walletId)}})
        res.docs.forEach(x => {
          x.likedNFTs = likedNFTs.filter(y => y.walletId === x.walletId)
        })
      }
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
      if (query.populateLikes){
        const userLikes = await NFTLikeModel.find({walletId: query.id}) as INFTLike[]
        user.likedNFTs = userLikes
      }
      return user
    } catch (err) {
      throw new Error(`User ${query.id} can't be found`);
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
   * @throws Will throw an error if already liked or if db can't be reached
   */
   async likeNft(query: likeUnlikeQuery): Promise<INFTLike> {
    try {
      const data = {serieId: query.serieId, walletId: query.walletId}
      const nftLike  = await NFTLikeModel.findOne(data);
      if (nftLike) throw new Error("NFT already liked")
      const newLike = new NFTLikeModel({nftId: query.nftId, serieId: query.serieId, walletId: query.walletId})
      await newLike.save()
      return newLike
    } catch (err) {
      throw new Error("Couldn't like NFT");
    }
  }

  /**
   * Unlike an NFT
   * @param query - see likeUnlikeQuery
   * @throws Will throw an error if already liked or if db can't be reached
   */
   async unlikeNft(query: likeUnlikeQuery): Promise<INFTLike> {
    try {
      const data = {serieId: query.serieId, walletId: query.walletId}
      const nftLike  = await NFTLikeModel.findOne(data);
      if (!nftLike) throw new Error("NFT already not liked")
      await NFTLikeModel.deleteOne(data)
      return nftLike
    } catch (err) {
      throw new Error("Couldn't unlike NFT");
    }
  }

  /**
   * Get all addresses that had any transaction changing their balance (transfer, create, burn, sale, buy, ...) || received an nft
   * @throws Will throw an error if already liked or if db can't be reached
   */
     async getAllAddresses(): Promise<void> {
      try {
        const json1={
          operationName:"Query",
          variables:{},
          query:`query Query{
            nftTransferEntities(
              orderBy: TIMESTAMP_DESC
              filter: { typeOfTransaction: { equalTo: "transfer" } }
            ) {
              totalCount
              nodes {
                to
              }
            }
          }`
        }
        const json2={
          operationName:"Query",
          variables:{},
          query:`query Query{
            accountEntities(orderBy: CREATED_AT_DESC) {
              totalCount
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
              nodes {
                id
              }
            }
          }`
        }
        const GQLRes1 = await fetch(`${process.env.INDEXER_URL}/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body:JSON.stringify(json1)
        });
        const GQLRes2 = await fetch(`${process.env.INDEXER_URL}/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body:JSON.stringify(json2)
        });
        const res1 = await GQLRes1.json()
        const res2 = await GQLRes2.json()
        let arr1 = []
        let arr2 = []
        if(res1 && res1.data && res1.data.nftTransferEntities && res1.data.nftTransferEntities.nodes){
          arr1 = res1.data.nftTransferEntities.nodes.map((x:any) => x.to)
        }
        if(res2 && res2.data && res2.data.accountEntities && res2.data.accountEntities.nodes){
          arr2 = res2.data.accountEntities.nodes.map((x:any) => x.id)
        }
        const finalArray = [...arr1, ...arr2].filter((x:string,i: number,arr: string[]) => arr.findIndex(y => y === x) === i)
        console.log(`total addresses : ${finalArray.length}`)
        fs.writeFileSync('all_users.json', JSON.stringify(finalArray))
        console.log("all ok")
      } catch (err) {
        console.log(err)
        throw new Error("Couldn't get all addresses");
      }
    }
}

export default new UserService();
