export interface IUser {
  _id: string;
  name: string;
  walletId: string;
  nbFollowers?: number;
  nbFollowing?: number;
  likedNFTs?: { serieId: string, nftId: string, walletId?:string }[];
  viewsCount?: number;
  twitterName?: string;
  twitterVerified?: boolean;
}