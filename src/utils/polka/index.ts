import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { BN_TEN, hexToU8a, isHex } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import types from './types'
import BN from 'bn.js';
import { DEFAULT_CAPS_AMOUNT } from '..';

const parseArgs = require('minimist')(process.argv.slice(2))
const SEED=parseArgs["SEED"] ? parseArgs["SEED"] : null

const provider = new WsProvider(process.env.BLOCK_CHAIN_URL);
const typesConverted = types as any

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
    }catch(error) {
        return false;
    }
}

export const processFaucetClaims = async (arrayOfAddresses: string[], setProcessedCallback: Function) => {
    // CLAIM HERE FROM BC
    const api = await getChainApiInstance()
    const sender = await getSender()
    if (api && sender) {
        const batchedTransactions = [];
        for (let i = 0; i < arrayOfAddresses.length; i++) {
            batchedTransactions.push(api.tx.balances.transferKeepAlive(arrayOfAddresses[i], unFormatBalance(DEFAULT_CAPS_AMOUNT)));
        }
        let extrinsic = api.tx.utility.batch(batchedTransactions)
        const unsub = await extrinsic.signAndSend(sender, async (result: any) => {
            if (result.status.isInBlock) {
                console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
                unsub();
                /*if (result. is ok){
                }*/
                await setProcessedCallback()
                console.log("All good")
            }
        })
    }else{
        throw new Error(`An error has occured processing this batch. (${arrayOfAddresses})`)
    }
}

export const getFaucetBalance = async () => {
    if (!(accountWalletSub && typeof accountWalletSub === 'function')) {
        const api = await getChainApiInstance()
        const sender = await getSender()
        if (api && sender){
            accountWalletSub = await api.query.system.account(sender.address)
            const { free } = accountWalletSub.data;
            balance = Number(free / (Math.pow(10,18)))
        }
    }
    return balance
}