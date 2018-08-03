import { createHash } from 'crypto';


const NAMESPACE = '5f4d76';
const _PREFIXES = {
  COLLECTION: '00',
  MOJI: '01',
  SIRE_LISTING: '02',
  OFFER: '03'
};
const PREFIXES = Object.keys(_PREFIXES).reduce((ps, key) => {
  ps[key] = `${NAMESPACE}${_PREFIXES[key]}`;
  return ps;
}, {});

const hash = (s, l = 62) => createHash('sha512').update(s).digest('hex').slice(0, l);

/**
 * A function which optionally takes a public key, and returns a full or
 * partial collection address.
 *
 * Works similarly to the processor version, but if the public key is omitted,
 * returns the 8 character prefix which can be used to fetch all collections
 * from the REST API. If the public key is provided, returns the full
 * 70 character address.
 *
 * Example:
 *   const prefix = getCollectionAddress();
 *   console.log(prefix);  // '5f4d7600'
 *   const address = getCollectionAddress(publicKey);
 *   console.log(address);
 *   // '5f4d7600ecd7ef459ec82a01211983551c3ed82169ca5fa0703ec98e17f9b534ffb797'
 */
export const getCollectionAddress = (publicKey = null) => {
  if (!publicKey) return PREFIXES.COLLECTION;
  return `${PREFIXES.COLLECTION}${hash(publicKey)}`;
};

/**
 * A function which optionally takes a public key and moji dna, returning
 * a full or partial moji address.
 *
 * If called with no arguments, returns the 8-char moji prefix. If called with
 * just a public key, returns the 16-char owner prefix which can fetch all
 * moji owned by this key. Passing in the dna as well returns a full address.
 *
 * Example:
 *   const ownerPrefix = getMojiAddress(publicKey);
 *   console.log(ownerPrefix);  // '5f4d7601ecd7ef45'
 */
export const getMojiAddress = (ownerKey = null, dna = null) => {
  if (!ownerKey) return PREFIXES.MOJI;
  if (!dna) return `${PREFIXES.MOJI}${hash(ownerKey, 8)}`;
  return `${PREFIXES.MOJI}${hash(ownerKey, 8)}${hash(dna, 54)}`;
};

/**
 * A function which optionally takes a public key, and returns a full or
 * partial sire listing address.
 *
 * If the public key is omitted, returns just the sire listing prefix,
 * otherwise returns the full address.
 */
export const getSireAddress = (ownerKey = null) => {
  if (!ownerKey) return PREFIXES.SIRE_LISTING;
  return `${PREFIXES.SIRE_LISTING}${hash(ownerKey)}`;
};

/**
 * EXTRA CREDIT
 * Only needed if you implement the full transaction processor, adding the
 * functionality to trade cryptomoji. Remove `.skip` from line 96 of
 * tests/04-Addressing.js to test.
 *
 * A function that optionally takes a public key and one or more moji
 * identifiers, and returns a full or partial offer address.
 *
 * If key or identifiers are omitted, returns just the offer prefix.
 * The identifiers may be either moji dna, or moji addresses.
 */
export const getOfferAddress = (ownerKey = null, moji = null) => {
  if (!ownerKey) return PREFIXES.OFFER;
  const collectionKey = `${PREFIXES.OFFER}${hash(ownerKey, 8)}`;
  if (!moji) return collectionKey;
  const mojiRefs = Array.isArray(moji) ? moji.sort().join('') : moji;
  return `${collectionKey}${hash(mojiRefs, 54)}`;
};

