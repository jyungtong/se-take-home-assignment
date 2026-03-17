'use strict';

const { OrderManager } = require('./orderManager');
const logger = require('./logger');

/**
 * Returns a promise that resolves after `ms` milliseconds.
 * Allows the simulation to progress step-by-step with real timing.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  logger.initResultFile("McDonald's Order Management System - Simulation Results");

  const manager = new OrderManager();
  logger.log('System initialized with 0 bots');

  // Step 1: Add 3 orders before any bots
  await sleep(500);
  manager.addNormalOrder();   // Order #1 - Normal

  await sleep(500);
  manager.addVIPOrder();      // Order #2 - VIP  (jumps ahead of Order #1)

  await sleep(500);
  manager.addNormalOrder();   // Order #3 - Normal

  // Step 2: Add 2 bots — they immediately pick up pending orders (VIP first)
  await sleep(500);
  manager.addBot();           // Bot #1 picks up VIP Order #2

  await sleep(500);
  manager.addBot();           // Bot #2 picks up Normal Order #1

  // Bots take 10 seconds each; after ~10s both complete their orders.
  // Bot #1 then picks up Normal Order #3; Bot #2 goes idle.

  // Step 3: While bots are processing, add a VIP order after ~12s
  await sleep(12_000);
  manager.addVIPOrder();      // Order #4 - VIP; Bot #2 (idle) picks it up

  // Step 4: Wait for all processing to finish (~10 more seconds)
  await sleep(11_000);

  // Step 5: Remove a bot (newest = Bot #2, should be idle by now)
  manager.removeBot();

  await sleep(500);

  // Final summary
  const status = manager.getStatus();
  const completed = manager.getCompletedOrders();
  const vipCompleted = completed.filter((o) => o.isVIP).length;
  const normalCompleted = completed.filter((o) => !o.isVIP).length;

  logger.write('\nFinal Status:');
  logger.write(`- Total Orders Processed: ${completed.length} (${vipCompleted} VIP, ${normalCompleted} Normal)`);
  logger.write(`- Orders Completed: ${completed.length}`);
  logger.write(`- Active Bots: ${status.bots}`);
  logger.write(`- Pending Orders: ${status.pending}`);

  await logger.closeResultFile();
}

main().catch((err) => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
