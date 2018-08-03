'use strict';

const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const { decode, encode } = require('../services/encoding');
const getPrng = require('../services/prng');
const { getCollectionAddress, getMojiAddress } = require('../services/addressing');

const emptyArray = size => Array.apply(null, Array(size));

const generateDNA = signature => {
  return emptyArray(9).map(() => {
    return (`0000${getPrng(signature)(2 ** 16).toString(16)}`).slice(-4);
  }).join('');
};

const createMoji = (key, signature) => {
  return {
    owner: key,
    sire: null,
    breeder: null,
    sired: [],
    bred: [],
    dna: generateDNA(signature)
  };
};

const createCollection = (ctx, signerKey, signature) => {
  const collectionRef = getCollectionAddress(signerKey);
  return ctx.getState([collectionRef])
    .then(state => {
      if (!!state[collectionRef].length) {
        throw new InvalidTransaction('Collection already exists with key:' + signerKey);
      }
      const moji = emptyArray(3).map(() => createMoji(signerKey, signature));
      let patch = {
        [collectionRef]: encode({
          key: signerKey,
          moji: moji.map(m => getMojiAddress(signerKey, m.dna)).sort()
        })
      };
      patch = moji.reduce((p, m) => {
        p[getMojiAddress(signerKey, m.dna)] = encode(m);
        return p;
      }, patch);
      return ctx.setState(patch);
    });
};

module.exports = createCollection;

