'use strict';

const { createHash } = require('crypto');
const signing = require('./signing');
const { Block, Blockchain } = require('./blockchain');


/**
 * A slightly modified version of a transaction. It should work mostly the
 * the same as the non-mineable version, but now recipient is optional,
 * allowing the creation of transactions that will reward miners by creating
 * new funds for their balances.
 */
class MineableTransaction {
  /**
   * If recipient is omitted, this is a reward transaction. The _source_ should
   * then be set to `null`, while the _recipient_ becomes the public key of the
   * signer.
   */
  constructor(privateKey, recipient = null, amount) {
    this.recipient = recipient;
    this.amount = amount;
    this.source = signing.getPublicKey(privateKey);
    if (!this.recipient) {
      this.recipient = this.source;
      this.source = null;
    }
    this.signature = signing.sign(privateKey, this.data);
  }

  get data() {
    return this.source + this.recipient + this.amount;
  }
}

/**
 * Almost identical to the non-mineable block. In fact, we'll extend it
 * so we can reuse the calculateHash method.
 */
class MineableBlock extends Block {
  /**
   * Unlike the non-mineable block, when this one is initialized, we want the
   * hash and nonce to not be set. This Block starts invalid, and will
   * become valid after it is mined.
   */
  constructor(transactions, previousHash) {
    super(transactions, previousHash);
    this.hash = null;
  }
}

/**
 * The new mineable chain is a major update to our old Blockchain. We'll
 * extend it so we can use some of its methods, but it's going to look
 * very different when we're done.
 */
class MineableChain extends Blockchain {
  /**
   * In addition to initializing a blocks array with a genesis block, this will
   * create hard-coded difficulty and reward properties. These are settings
   * which will be used by the mining method.
   *
   * Properties:
   *   - blocks: an array of mineable blocks
   *   - difficulty: a number, how many hex digits must be zeroed out for a
   *     hash to be valid, this will increase mining time exponentially, so
   *     probably best to set it pretty low (like 2 or 3)
   *   - reward: a number, how much to award the miner of each new block
   *
   * Hint:
   *   You'll also need some sort of property to store pending transactions.
   *   This will only be used internally.
   */
  constructor() {
    super();
    this.blocks = [new MineableBlock([], null)];
    this.difficulty = 2;
    this.reward = Math.ceil(Math.random() * 100);
    this._transactionQ = [];
  }

  /**
   * No more adding blocks directly.
   */
  addBlock() {
    throw new Error('Must mine to add blocks to this blockchain');
  }

  /**
   * Instead of blocks, we add pending transactions. This method should take a
   * mineable transaction and simply store it until it can be mined.
   */
  addTransaction(transaction) {
    this._transactionQ.push(transaction);
  }

  /**
   * This method takes a private key, and uses it to create a new transaction
   * rewarding the owner of the key. This transaction should be combined with
   * the pending transactions and included in a new block on the chain.
   *
   * Note:
   *   Only certain hashes are valid for blocks now! In order for a block to be
   *   valid it must have a hash that starts with as many zeros as the
   *   the blockchain's difficulty. You'll have to keep trying nonces until you
   *   find one that works!
   *
   * Hint:
   *   Don't forget to clear your pending transactions after you're done.
   */
  mine(privateKey) {
    this.addTransaction(
      new MineableTransaction(privateKey, null, this.reward)
    );
    const b = new Block(this._transactionQ, this.getHeadBlock().hash);
    while (b.hash.slice(0, this.difficulty) !== ('0'.repeat(this.difficulty))) {
      b.calculateHash(b.nonce + 1);
    }
    this.blocks.push(b);
    this._transactionQ = [];
  }
}

const validPrefix = bc => b => b.hash.slice(0, bc.difficulty) === ('0'.repeat(bc.difficulty));
const countNullSources = bc => b => {
  return b.transactions.reduce((count, t) => {
    return count + (t.source === null ? 1 : 0);
  }, 0);
};
const validAmounts = bc => b => b.transactions.every(t => {
  if (t.source === null) return t.amount === bc.reward;
  return true;
});
const validBalances = (bc, register) => b => {
  for (const { source, recipient, amount } of b.transactions) {
    if (source) {
      register.set(source, register.get(source) || 0);
      register.set(source, register.get(source) - amount);
      if (register.get(source) < 0) return false;
    }
    register.set(recipient, register.get(recipient) || 0);
    register.set(recipient, register.get(recipient) + amount);
  }
  return true;
};
/**
 * A new validation function for our mineable blockchains. Forget about all the
 * signature and hash validation we did before. Our old validation functions
 * may not work right, but rewriting them would be a very dull experience.
 *
 * Instead, this function will make a few brand new checks. It should reject
 * a blockchain with:
 *   - any hash other than genesis's that doesn't start with the right
 *     number of zeros
 *   - any block that has more than one transaction with a null source
 *   - any transaction with a null source that has an amount different
 *     than the reward
 *   - any public key that ever goes into a negative balance by sending
 *     funds they don't have
 */
const isValidMineableChain = bc => {
  return (
    bc.blocks.slice(1).every(validPrefix(bc)) &&
    bc.blocks.map(countNullSources(bc)).every(count => count < 2) &&
    bc.blocks.every(validAmounts(bc)) &&
    bc.blocks.every(validBalances(bc, new Map()))
  );
};

module.exports = {
  MineableTransaction,
  MineableBlock,
  MineableChain,
  isValidMineableChain
};
