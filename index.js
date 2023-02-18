import * as ecc from 'tiny-secp256k1';
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import {BIP32Factory} from "bip32";

const bip32 = BIP32Factory(ecc);
const networks = bitcoin.networks;

const MNEMONIC = 'pyramid sport hunt mushroom hope jewel mountain sniff damage lunch mule inch';
const ADDRESSES_TO_SEARCH_FOR = ['1K6UnW7vaVk2gGS8BQ3HKqkLMtv7NtkYKL', 'bc1qrjz3acmxqkhz25zmwu2auht44ghezvkj5rp2m4', 'bc1qkme746j507l2c650f96yy69yy4jnnu55d44rt6'];
const MAX_INDEX_COUNT = 50; // Max number of addresses to generate per path.
const VERBOSE = false; // If set to true, will log every generated address.

const pathObject = {
  purpose: '0',
  cointype: '0',
  account: '0',
  change: '0',
  index: '0',
};
const purpose = ['0', '44', '49', '84'];
const coinType = ['0', '1'];
const change = ['0', '1'];
const addressTypes = ['p2pkh', 'p2sh', 'p2wpkh'];

const pathObjToStr = (obj) => {
    const {purpose, cointype, account, change, index} = obj;
    return `m/${purpose}'/${cointype}'/${account}'/${change}/${index}`;
};

const runTest = () => {
    if (!MNEMONIC) {
        console.log('Please add a mnemonic to the MNEMONIC variable.');
        return;
    }
    if (!ADDRESSES_TO_SEARCH_FOR.length) {
        console.log('Please add addresses to search for in the ADDRESSES_TO_LOOKFOR array.');
        return;
    }
    console.log(`\nMnemonic:\n${MNEMONIC}\n`);

    let found = false;
    const addressesFound = [];
    purpose.map((_purpose) => {
        addressTypes.map((_addressType) => {
            coinType.map((_coinType) => {
                change.map((_change) => {
                    let i = 0;
                    while (i <= MAX_INDEX_COUNT) {
                        const pObj = {...pathObject};
                        pObj.purpose = _purpose;
                        pObj.cointype = _coinType;
                        pObj.change = _change;
                        pObj.index = i;
                        const path = pathObjToStr(pObj);
                        const res = getAddress({ path, type: _addressType, cointype: _coinType });
                        const addrData = {...res, type: _addressType};
                        if (ADDRESSES_TO_SEARCH_FOR.includes(res.address)) {
                            addressesFound.push(addrData);
                            found = true;
                        }
                        if (VERBOSE) console.log(addrData);
                        i++
                    }
                });
            });
        });
    });

    if (found) {
        console.log('Found the following addresses:\n');
        console.log(addressesFound);
    } else {
        console.log('No matches for the provided addresses.');
    }
};

const getAddress = ({path, type, cointype}) => {
    const network = cointype === '0' ? networks['bitcoin'] : networks['testnet'];
    const seed = bip39.mnemonicToSeedSync(MNEMONIC, '');
    const root = bip32.fromSeed(seed, network);
    const keyPair = root.derivePath(path);
    let address = '';
    switch (type) {
        case 'p2wpkh':
            //Get Native Bech32 (bc1) addresses
            address = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }).address;
            break;
        case 'p2sh':
            //Get Segwit P2SH Address (3)
            address = bitcoin.payments.p2sh({
                redeem: bitcoin.payments.p2wpkh({
                    pubkey: keyPair.publicKey,
                    network,
                }),
                network,
            }).address;
            break;
        case 'p2pkh':
            //Get Legacy Address (1)
            address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network }).address;
            break;
    }
    return {
        address,
        path,
        publicKey: keyPair.publicKey.toString('hex'),
        privateKey: keyPair.toWIF(),
    }
}

runTest();


