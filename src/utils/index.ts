import { decodeAddress, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

export const LIMIT_MAX_PAGINATION = 50
export const DEFAULT_CAPS_AMOUNT = 1150
export const DEFAULT_FAUCET_BATCH_SIZE = 100
export const FAUCET_ADDRESS = "5CtE5KeuNPtBazwVHdCyNwxAmSUzdTaM2eG82o1Z4d9uJZfA"

export const validateEmail = (mail: string) => {
    const mailRegEx = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/
    return mail.match(mailRegEx)
}

export const validateTwitter = (twitterName: string) => {
    const twitterNameRegEx = /^@[a-zA-Z0-9_]/
    return twitterName.match(twitterNameRegEx)
}

export const validateUrl = (url: string) => {
    const urlRegEx = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/
    return url.match(urlRegEx)
}

export const isValidSignature = (plainData: string, signedData: string, address: string) => {
    const publicKey = decodeAddress(address);
    const hexPublicKey = u8aToHex(publicKey);
    return signatureVerify(plainData, signedData, hexPublicKey).isValid;
}

export const getSerieIdByQrId = (qrId: string) => {
    switch(qrId){
        case "0":
            return process.env.NFT_SERIES_ID
        case "1":
            return process.env.NFT_SERIES_ID
        case "2":
            return process.env.NFT_SERIES_ID
        case "3":
            return process.env.NFT_SERIES_ID
        default:
            return process.env.NFT_SERIES_ID
    }
}