import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { BN_TEN, hexToU8a, isHex } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import types from './types'
import BN from 'bn.js';
import fetch from "node-fetch";
import { DEFAULT_CAPS_AMOUNT } from '..';
import { INFTClaim } from '../../interfaces/INFTClaim';

const parseArgs = require('minimist')(process.argv.slice(2))
const SEED = parseArgs["SEED"] ? parseArgs["SEED"] : null

const provider = new WsProvider(process.env.BLOCK_CHAIN_URL);
const typesConverted = types.types as any
let api: any = null;
let keyring: any = null;
let sender: any = null;
let accountWalletSub: any = null
let balance: any = 0

export const getChainApiInstance = async () => {
    if (api && api.isConnected) {
        return api;
    } else {
        api = await ApiPromise.create({ provider, types: typesConverted });
        return api;
    }
};

const getKeyring = async () => {
    await cryptoWaitReady();
    return new Keyring({ type: 'sr25519' });
}

export const getSender = async () => {
    if (!keyring) keyring = await getKeyring()
    if (keyring && SEED && !sender) sender = keyring.createFromUri(SEED)
    return sender
}

export const unFormatBalance = (_input: number) => {
    const input = '' + _input;
    const siPower = new BN(api.registry.chainDecimals[0]);
    const basePower = api.registry.chainDecimals[0];
    const siUnitPower = 0;
    const isDecimalValue = input.match(/^(\d+)\.(\d+)$/);

    let result;

    if (isDecimalValue) {
        if (siUnitPower - isDecimalValue[2].length < -basePower) {
            result = new BN(-1);
        }
        const div = new BN(input.replace(/\.\d*$/, ''));
        const modString = input.replace(/^\d+\./, '').substr(0, api.registry.chainDecimals[0]);
        const mod = new BN(modString);

        result = div.mul(BN_TEN.pow(siPower)).add(mod.mul(BN_TEN.pow(new BN(basePower + siUnitPower - modString.length))));
    } else {
        result = new BN(input.replace(/[^\d]/g, '')).mul(BN_TEN.pow(siPower));
    }
    return result;
}

export const isValidAddress = (address: string) => {
    try {
        encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
        return true;
    } catch (error) {
        return false;
    }
}

export const convertAddress = (address: string) => {
    try{
        return encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
    }catch(err){
        console.log(err)
    }
}

export const processFaucetClaims = async (arrayOfCAPSAddresses: string[], arrayOfNFTClaims: INFTClaim[], setProcessedCallback: Function) => {
    // CLAIM HERE FROM BC
    const api = await getChainApiInstance()
    const sender = await getSender()
    let availableNFTIds = [] as any
    let givenNFTIdInThisBatch = [] as any
    if (api && sender) {
        const batchedTransactions = [];
        const faucetbalance= await getFaucetBalance();
        if(faucetbalance>  arrayOfCAPSAddresses.length*DEFAULT_CAPS_AMOUNT){
            for (let i = 0; i < arrayOfCAPSAddresses.length; i++) {
                batchedTransactions.push(api.tx.balances.transferKeepAlive(arrayOfCAPSAddresses[i], unFormatBalance(DEFAULT_CAPS_AMOUNT)));
            }
        }
        for (let i = 0; i < arrayOfNFTClaims.length; i++) {
            if (arrayOfNFTClaims[i].serieId){
                availableNFTIds = await getFaucetNFTs(arrayOfNFTClaims[i].serieId as string)
                let availableNFTIdsNotGivenYet = availableNFTIds.filter((x: any) => !givenNFTIdInThisBatch.includes(x.id))
                if (availableNFTIdsNotGivenYet.length > 0){
                    givenNFTIdInThisBatch.push(availableNFTIdsNotGivenYet[0].id)
                    batchedTransactions.push(api.tx.nfts.transfer(Number(availableNFTIdsNotGivenYet[0].id), arrayOfNFTClaims[i].walletId));
                }else{
                    console.log(`Account ${arrayOfNFTClaims[i].walletId} could not have been processed cause serieId ${arrayOfNFTClaims[i].serieId} had no more NFT`)
                }
            }
        }
        if (batchedTransactions.length > 0) {
            let extrinsic = api.tx.utility.batch(batchedTransactions)
            const unsub = await extrinsic.signAndSend(sender, async ({ events = [], status }: any) => {
                if (status.isInBlock) {
                    console.log(`Transaction included at blockHash ${status.asInBlock}`);
                    unsub();
                    let successAddressesClaim: any[] = [];
                    let successAddressesNFTransfer: any[] = [];
                    events.forEach(async ({ event }: any) => {
                        const { data, method, section } = event;
                        // console.log('event', section, method, status);
                        if (`${section}.${method}` === 'balances.Transfer') {
                            //1st index is the TO of transfer
                            console.log('balances.Transfer : ', data[1].toString())
                            successAddressesClaim.push(data[1].toString())
                        }
                        if (`${section}.${method}` === 'nfts.Transfer') {
                            //1st index is the TO of transfer
                            console.log('nfts.transfer : ', data[2].toString())
                            successAddressesNFTransfer.push(data[2].toString())
                        }
                    });
                    await setProcessedCallback(successAddressesClaim, successAddressesNFTransfer)
                    console.log("All good")
                }
            })
        } else {
            throw new Error(`Not Enough NFT available`)
        }
    } else {
        throw new Error(`An error has occured processing this batch. (${arrayOfCAPSAddresses})`)
    }
}

export const getFaucetBalance = async () => {
    if (!(accountWalletSub && typeof accountWalletSub === 'function')) {
        const api = await getChainApiInstance()
        const sender = await getSender()
        if (api && sender) {
            accountWalletSub = await api.query.system.account(sender.address)
            const { free } = accountWalletSub.data;
            balance = Number(free / (Math.pow(10, 18)))
        }
    }
    return balance
}

export const getUserBalance = async (address: string) => {
    let userBalance = 0
    const api = await getChainApiInstance()
    if (api) {
        const account = await api.query.system.account(address)
        const { free } = account.data;
        userBalance = Number(free / (Math.pow(10, 18)))
    }
    return userBalance
}

export const getFaucetNFTs = async (serieId: string) => {
    try {
        const sender = await getSender()
        const json={
            operationName:"Query",
            variables:{},
            query:`query Query{
            nftEntities(filter: { 
            and : [
              { owner: { equalTo: "${sender.address}" } },
              {serieId:{equalTo:"${serieId || ""}"}}
              {timestampBurn:{isNull:true}}
            ]
          } 
              orderBy:CREATED_AT_ASC ){
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
        if(res && res.data && res.data.nftEntities && res.data.nftEntities.nodes){
            // console.log('res', res.data.nftEntities.nodes);
            return res.data.nftEntities.nodes
        }else {
            return []
        }
    } catch (err) {
        console.log('getFaucetNFTs err:', err)
        return []
    }
}