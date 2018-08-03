'use strict';

const { createHash } = require('crypto');

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
 * A function that takes a public key and returns the corresponding collection
 * address.
 *
 * This is simpler than the client version, as the public key is not optional.
 * Processor addressing methods always return a full address.
 *
 * Example:
 *   const address = getCollectionAddress(publicKey);
 *   console.log(address);
 *   // '5f4d7600ecd7ef459ec82a01211983551c3ed82169ca5fa0703ec98e17f9b534ffb797'
 */
const getCollectionAddress = publicKey => {
  return `${PREFIXES.COLLECTION}${hash(publicKey, 62)}`;
};

/**
 * A function that takes a public key and a moji dna string, returning the
 * corresponding moji address.
 */
const getMojiAddress = (ownerKey, dna) => {
  return `${PREFIXES.MOJI}${hash(ownerKey, 8)}${hash(dna, 54)}`;
};

/**
 * A function that takes a public key, and returns the corresponding sire
 * listing address.
 */
const getSireAddress = ownerKey => {
  return `${PREFIXES.SIRE_LISTING}${hash(ownerKey)}`;
};

/**
 * EXTRA CREDIT
 * Only needed if you add trading cryptomoji to your transaction processor.
 * Remove the `.skip` from line 184 of tests/01-Services.js to test.
 *
 * A function that takes a public key and one or more moji addresses,
 * returning the corresponding offer address.
 *
 * Unlike the client version, moji may only be identified by addresses, not
 * dna strings.
 */
const getOfferAddress = (ownerKey, addresses) => {
  if (!ownerKey) return PREFIXES.OFFER;
  const collectionKey = `${PREFIXES.OFFER}${hash(ownerKey, 8)}`;
  if (!addresses) return collectionKey;
  const mojiRefs = Array.isArray(addresses) ? addresses.sort().join('') : addresses;
  return `${collectionKey}${hash(mojiRefs, 54)}`;
};

/**
 * A function that takes an address and returns true or false depending on
 * whether or not it is a valid Cryptomoji address. It should reject an
 * address if:
 *   - it is not a string
 *   - it is not 70 hex characters
 *   - it does not start with the correct namespace
 *
 * Example:
 *   const isValid = isValidAddress('00000000');
 *   console.log(isValid);  // false
 */
const isValidAddress = (address = '') => {
  return (
    typeof address === 'string' &&
    address.length === 70 &&
    address.slice(0, NAMESPACE.length) === NAMESPACE
  );
};

module.exports = {
  getCollectionAddress,
  getMojiAddress,
  getSireAddress,
  getOfferAddress,
  isValidAddress
};
