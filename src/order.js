'use strict';

const ORDER_TYPE = Object.freeze({ NORMAL: 'Normal', VIP: 'VIP' });
const ORDER_STATUS = Object.freeze({ PENDING: 'PENDING', PROCESSING: 'PROCESSING', COMPLETE: 'COMPLETE' });

class Order {
  constructor(id, type) {
    this.id = id;
    this.type = type;
    this.status = ORDER_STATUS.PENDING;
  }

  get isVIP() {
    return this.type === ORDER_TYPE.VIP;
  }

  toString() {
    return `${this.type} Order #${this.id}`;
  }
}

module.exports = { Order, ORDER_TYPE, ORDER_STATUS };
