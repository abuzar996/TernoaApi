import { decodeAddress, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { ethers } from 'ethers'

export const LIMIT_MAX_PAGINATION = 50
export const DEFAULT_CAPS_AMOUNT = 1150
export const MAX_CAPS_AMOUNT_IN_WALLET = 10500
export const DEFAULT_FAUCET_BATCH_SIZE = 100
export const FAUCET_ADDRESS = "5CtE5KeuNPtBazwVHdCyNwxAmSUzdTaM2eG82o1Z4d9uJZfA"

export const isValidSignature = (plainData: string, signedData: string, address: string) => {
    const publicKey = decodeAddress(address);
    const hexPublicKey = u8aToHex(publicKey);
    return signatureVerify(plainData, signedData, hexPublicKey).isValid;
}

export const getSerieIdByQrId = (qrId: number) => {
    switch(qrId){
        case 0:
            return process.env.NFT_SERIES_ID
        case 1:
            return process.env.NFT_SERIES_ID
        case 2:
            return process.env.NFT_SERIES_ID
        case 3:
            return process.env.NFT_SERIES_ID
        default:
            return process.env.NFT_SERIES_ID
    }
}

export const isValidSignatureEth = (plainData: string, signedData: string, ethAddress: string) => {
    try{
        const signerAddress = ethers.utils.verifyMessage(plainData, signedData)
        if (signerAddress === ethAddress) return true
        return false
    }catch(err){
        console.log(err)
        return false
    }
}