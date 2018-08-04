'use strict';

const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const { getCollectionAddress, getSireAddress } = require('../services/addressing');
const { decode, encode } = require('../services/encoding');

const thw = msg => { throw new InvalidTransaction(msg); };

const selectSire = (ctx, signerKey, signature, payload) => {
  const cref = getCollectionAddress(signerKey);
  return ctx.getState([cref]).then(state => {
    if (!state[cref].length) thw('Collection does not exist at address: ' + cref);
    const { sire } = payload;
    return ctx.getState([sire])
      .then(m => {
        if (!m[sire] || !m[sire].length) thw('Cryptomoji does not exist at the given address');
        const moji = decode(m[sire]);
        if (moji.owner !== signerKey) thw('Signer does not own the given Cryptomoji');
        return ctx.setState({
          [getSireAddress(signerKey)]: encode({ owner: signerKey, sire })
        });
      });
    });
};

module.exports = selectSire;

