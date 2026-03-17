'use strict';

const { ORDER_STATUS } = require('./order');

const BOT_STATUS = Object.freeze({ IDLE: 'IDLE', ACTIVE: 'ACTIVE' });
const PROCESSING_TIME_MS = 10_000;

class Bot {
  /**
   * @param {number} id
   * @param {function(Bot): void} onOrderComplete  called when the bot finishes an order
   */
  constructor(id, onOrderComplete) {
    this.id = id;
    this.status = BOT_STATUS.IDLE;
    this.currentOrder = null;
    this._onOrderComplete = onOrderComplete;
    this._timer = null;
  }

  /** Pick up an order and start processing it. */
  pickupOrder(order) {
    order.status = ORDER_STATUS.PROCESSING;
    this.currentOrder = order;
    this.status = BOT_STATUS.ACTIVE;

    this._timer = setTimeout(() => {
      this._completeOrder();
    }, PROCESSING_TIME_MS);
  }

  /**
   * Cancel current processing (bot is being removed).
   * Returns the order that was in progress (or null if idle).
   */
  cancel() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    const order = this.currentOrder;
    if (order) {
      order.status = ORDER_STATUS.PENDING;
      this.currentOrder = null;
    }
    this.status = BOT_STATUS.IDLE;
    return order;
  }

  _completeOrder() {
    const order = this.currentOrder;
    order.status = ORDER_STATUS.COMPLETE;
    this.currentOrder = null;
    this.status = BOT_STATUS.IDLE;
    this._timer = null;
    this._onOrderComplete(this, order);
  }
}

module.exports = { Bot, BOT_STATUS, PROCESSING_TIME_MS };
