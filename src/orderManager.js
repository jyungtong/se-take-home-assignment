'use strict';

const { Order, ORDER_TYPE, ORDER_STATUS } = require('./order');
const { Bot } = require('./bot');
const logger = require('./logger');

class OrderManager {
  constructor() {
    this._nextOrderId = 1;
    this._nextBotId = 1;
    /** @type {Order[]} */
    this._pendingQueue = [];
    /** @type {Order[]} */
    this._completedOrders = [];
    /** @type {Bot[]} */
    this._bots = [];
  }

  // ---------------------------------------------------------------------------
  // Orders
  // ---------------------------------------------------------------------------

  /** Add a new Normal order. */
  addNormalOrder() {
    const order = new Order(this._nextOrderId++, ORDER_TYPE.NORMAL);
    this._enqueue(order);
    logger.log(`Created ${order} - Status: ${order.status}`);
    this._dispatchIdleBots();
    return order;
  }

  /** Add a new VIP order (placed after existing VIPs, before all Normals). */
  addVIPOrder() {
    const order = new Order(this._nextOrderId++, ORDER_TYPE.VIP);
    this._enqueue(order);
    logger.log(`Created ${order} - Status: ${order.status}`);
    this._dispatchIdleBots();
    return order;
  }

  // ---------------------------------------------------------------------------
  // Bots
  // ---------------------------------------------------------------------------

  /** Create a new bot and immediately assign a pending order if available. */
  addBot() {
    const bot = new Bot(this._nextBotId++, (b, order) => this._onOrderComplete(b, order));
    this._bots.push(bot);
    logger.log(`Bot #${bot.id} created - Status: ACTIVE`);
    this._dispatchBot(bot);
    return bot;
  }

  /**
   * Destroy the newest bot. If it was processing an order, return that order
   * to its correct priority position in the pending queue.
   */
  removeBot() {
    if (this._bots.length === 0) {
      logger.log('No bots to remove');
      return null;
    }
    const bot = this._bots.pop();
    const returnedOrder = bot.cancel();

    if (returnedOrder) {
      this._enqueue(returnedOrder);
      logger.log(`Bot #${bot.id} destroyed - ${returnedOrder} returned to PENDING`);
    } else {
      logger.log(`Bot #${bot.id} destroyed while IDLE`);
    }
    return bot;
  }

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------

  getStatus() {
    return {
      bots: this._bots.length,
      pending: this._pendingQueue.length,
      completed: this._completedOrders.length,
      activeBots: this._bots.filter((b) => b.currentOrder !== null).length,
    };
  }

  getPendingQueue() {
    return [...this._pendingQueue];
  }

  getCompletedOrders() {
    return [...this._completedOrders];
  }

  getBots() {
    return [...this._bots];
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Insert an order into the pending queue respecting priority:
   * VIP orders go after the last existing VIP order, before any Normal orders.
   * Normal orders go at the end.
   */
  _enqueue(order) {
    if (order.type === ORDER_TYPE.VIP) {
      // Find the insertion point: after the last VIP entry
      let insertAt = 0;
      for (let i = 0; i < this._pendingQueue.length; i++) {
        if (this._pendingQueue[i].type === ORDER_TYPE.VIP) {
          insertAt = i + 1;
        }
      }
      this._pendingQueue.splice(insertAt, 0, order);
    } else {
      this._pendingQueue.push(order);
    }
  }

  /** Dispatch a specific idle bot to the next pending order if available. */
  _dispatchBot(bot) {
    if (this._pendingQueue.length === 0) {
      logger.log(`Bot #${bot.id} is now IDLE - No pending orders`);
      return;
    }
    const order = this._pendingQueue.shift();
    bot.pickupOrder(order);
    logger.log(`Bot #${bot.id} picked up ${order} - Status: PROCESSING`);
  }

  /** Assign pending orders to all idle bots. */
  _dispatchIdleBots() {
    for (const bot of this._bots) {
      if (bot.currentOrder === null && this._pendingQueue.length > 0) {
        const order = this._pendingQueue.shift();
        bot.pickupOrder(order);
        logger.log(`Bot #${bot.id} picked up ${order} - Status: PROCESSING`);
      }
    }
  }

  /** Called by a bot when it finishes processing an order. */
  _onOrderComplete(bot, order) {
    this._completedOrders.push(order);
    logger.log(`Bot #${bot.id} completed ${order} - Status: COMPLETE (Processing time: 10s)`);
    this._dispatchBot(bot);
  }
}

module.exports = { OrderManager };
