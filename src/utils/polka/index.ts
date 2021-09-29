import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { BN_TEN, hexToU8a, isHex } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import types from './types'
import BN from 'bn.js';


const provider = new WsProvider(process.env.BLOCK_CHAIN_URL);
const typesConverted = types as any

let api: any = null;
export const getChainApiInstance = async () => {
    if (api && api.isConnected) {
        return api;
    } else {
        api = await ApiPromise.create({ provider, types: typesConverted });
        return api;
    }
};

export const getKeyring = async () => {
    await cryptoWaitReady();
    return new Keyring({ type: 'sr25519' });
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
    //console.log('unformat balance result', result);
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

