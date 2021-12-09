export interface IEventWhitelistSignature {
    ethAddress: string;
    eventNumber: number;
    walletId?: string;
    signature?: string;
}