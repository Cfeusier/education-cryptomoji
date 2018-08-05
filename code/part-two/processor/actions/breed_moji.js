'use strict';

const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const {
  getCollectionAddress,
  getSireAddress,
  getMojiAddress,
  isValidAddress,
} = require('../services/addressing');
const { decode, encode } = require('../services/encoding');
const getPrng = require('../services/prng')

const thw = msg => { throw new InvalidTransaction(msg); };

const dnaRegX = RegExp(`[0-9a-f]{4,4}`, 'g');
const matches = s => s.match(dnaRegX);
const dnaStringToDnaInts = s => matches(s).map(h => parseInt(h, 16));

const generateDNA = (sdna, bdna, sig) => {
  const sireGenes = dnaStringToDnaInts(sdna);
  const breederGenes = dnaStringToDnaInts(bdna);
  const seed = getPrng(sig);
  return sireGenes.map((sg, idx) => {
    if (seed < 200) return Math.floor((sg + breederGenes[idx]) / 2);
    if (seed < 600) return sg;
    return breederGenes[idx];
  })
  .join('');
};

const breedMoji = (ctx, signerKey, signature, payload) => {
  const cref = getCollectionAddress(signerKey);
  return ctx.getState([cref]).then(state => {
    if (!state[cref].length) thw('Collection does not exist at address: ' + cref);
    const { sire, breeder } = payload;
    const collection = state[cref];
    return ctx.getState([sire, breeder])
      .then(state => {
        const s = state[sire];
        const b = state[breeder];
        if (
          !s || !s.length ||
          !b || !b.length ||
          !isValidAddress(sire) || !isValidAddress(breeder)
        ) {
          thw('Cryptomoji does not exist at the given address');
        }
        return { sm: decode(s), bm: decode(b), c: decode(collection) };
      })
      .then(({ sm, bm, c }) => {
        if (bm.owner !== signerKey) thw('Signer does not own the given breeder');
        const sListing = getSireAddress(sm.owner);
        return ctx.getState([sListing])
          .then(listState => {
            const ls = listState[sListing];
            if (!ls || !ls.length) thw('Sire listing does not exist');
            const lsd = decode(ls);
            if (lsd.sire !== sire) thw('Sire is not in the sire listing of the signer');
            const dna = generateDNA(sm.dna, bm.dna, signature);
            const mref = getMojiAddress(signerKey, dna);
            sm.sired.push(mref);
            bm.bred.push(mref);
            c.moji.push(mref);
            return ctx.setState({
              [mref]: encode({
                sire,
                breeder,
                dna,
                owner: signerKey,
                sired: [],
                bred: [],
              }),
              [sire]: encode(sm),
              [breeder]: encode(bm),
              [cref]: encode(c)
            });
          });
      });
  });
};

module.exports = breedMoji;

