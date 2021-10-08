import { decodeAddress, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

export const LIMIT_MAX_PAGINATION = 50
export const DEFAULT_CAPS_AMOUNT = 150
export const DEFAULT_FAUCET_BATCH_SIZE = 500

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