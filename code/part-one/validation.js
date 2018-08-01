'use strict';

const { createHash } = require('crypto');
const signing = require('./signing');

/**
 * A simple validation function for transactions. Accepts a transaction
 * and returns true or false. It should reject transactions that:
 *   - have negative amounts
 *   - were improperly signed
 *   - have been modified since signing
 */
const isValidTransaction = transaction => {
  return (
    transaction.amount > -1 &&
    signing.verify(transaction.source, transaction.data, transaction.signature)
  );
};

/**
 * Validation function for blocks. Accepts a block and returns true or false.
 * It should reject blocks if:
 *   - their hash or any other properties were altered
 *   - they contain any invalid transactions
 */
const isValidBlock = block => {
  if (block.hash !== signing.hash(block.data).toString('hex')) return false;
  return block.transactions.every(isValidTransaction);
};

const _validLength = bc => !!bc.blocks.length;

const _validBlocks = bc => bc.blocks.every(isValidBlock);

const _validHashes = bc => {
  return bc.blocks.every((b, idx) => {
    if (idx === 0 && b.previousHash === null) return true;
    return b.previousHash === (bc.blocks[idx - 1] || {}).hash;
  });
};
/**
 * One more validation function. Accepts a blockchain, and returns true
 * or false. It should reject any blockchain that:
 *   - is a missing genesis block
 *   - has any block besides genesis with a null hash
 *   - has any block besides genesis with a previousHash that does not match
 *     the previous hash
 *   - contains any invalid blocks
 *   - contains any invalid transactions
 */
const isValidChain = bc => {
  return (
    _validLength(bc) &&
    _validBlocks(bc) &&
    _validHashes(bc)
  );
  return true;
};

/**
 * This last one is just for fun. Become a hacker and tamper with the passed in
 * blockchain, mutating it for your own nefarious purposes. This should
 * (in theory) make the blockchain fail later validation checks;
 */
const breakChain = blockchain => {
  blockchain.blocks[1].previousHash = null;
  blockchain.blocks.shift();
};

module.exports = {
  isValidTransaction,
  isValidBlock,
  isValidChain,
  breakChain
};
