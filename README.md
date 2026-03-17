# McDonald's Order Management System

A CLI-based automated order management system simulating McDonald's cooking-bot workflow. Built as a take-home software engineering assignment using Node.js and TypeScript.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
  - [Scripted Simulation](#scripted-simulation)
  - [Interactive TUI](#interactive-tui)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [OrderManager API](#ordermanager-api)
- [Design Decisions](#design-decisions)
- [CI/CD](#cicd)

---

## Overview

The system models a restaurant order queue processed by a fleet of cooking bots. Key behaviors:

- **Normal orders** join the back of the pending queue (FIFO).
- **VIP orders** are inserted after the last existing VIP order, ahead of all Normal orders.
- **Cooking bots** each process one order at a time, taking exactly 10 seconds per order.
- **Idle bots** immediately pick up a new order the moment one arrives.
- **Bot removal** follows LIFO (newest bot first); any in-progress order is returned to its correct priority position in the pending queue.
- All state is held in memory — no persistence layer.

---

## Architecture

```
                          ┌─────────────────┐
                          │    index.ts      │
                          │  (Entry Point)   │
                          │                  │
                          │  ┌────────────┐  │
                          │  │   main()   │  │  <-- Scripted simulation
                          │  └────────────┘  │
                          │  ┌─────────────┐ │
                          │  │interactive()│ │  <-- Interactive TUI (readline)
                          │  └─────────────┘ │
                          └────────┬─────────┘
                                   │ creates & calls
                                   ▼
                       ┌─────────────────────────┐
                       │      OrderManager        │
                       │                          │
                       │  _pendingQueue: Order[]  │  <-- Priority queue
                       │  _completedOrders: []    │
                       │  _bots: Bot[]            │
                       │                          │
                       │  addNormalOrder()        │
                       │  addVIPOrder()           │
                       │  addBot()                │
                       │  removeBot()             │
                       │  _enqueue()  (priority)  │
                       │  _dispatchBot()          │
                       │  _dispatchIdleBots()     │
                       └────────┬────────────┬────┘
                                │            │
               creates/manages  │            │ onOrderComplete callback
                                ▼            │
                    ┌──────────────────┐     │
                    │       Bot        │─────┘
                    │                  │
                    │  id: number      │
                    │  currentOrder    │
                    │  pickupOrder()   │  <-- sets 10s setTimeout
                    │  cancel()        │  <-- clears timer, returns order
                    └──────────────────┘
                                │
                        holds reference to
                                ▼
                    ┌──────────────────┐
                    │      Order       │
                    │                  │
                    │  id: number      │
                    │  type: VIP|Normal│
                    │  status: PENDING │
                    │         PROCESSING│
                    │         COMPLETE │
                    └──────────────────┘

        All components write through:
                    ┌──────────────────┐
                    │     Logger       │
                    │   (singleton)    │
                    │                  │
                    │  stdout          │
                    │  result.txt      │
                    └──────────────────┘
```

### Components

| Component | File | Responsibility |
|---|---|---|
| `OrderManager` | `src/orderManager.ts` | Central orchestrator. Owns the pending queue, completed list, and bot fleet. Handles priority insertion, bot dispatch, and order completion callbacks. |
| `Bot` | `src/bot.ts` | Stateful entity that processes one order at a time via a `setTimeout` timer. Supports graceful cancellation. |
| `Order` | `src/order.ts` | Immutable value object with `id`, `type` (Normal/VIP), and mutable `status` (PENDING → PROCESSING → COMPLETE). |
| `Logger` | `src/logger.ts` | Singleton dual-output logger. Writes timestamped `[HH:MM:SS]` lines to both `stdout` and `scripts/result.txt`. |
| `index.ts` | `src/index.ts` | Entry point. Runs a scripted simulation by default; passes `--interactive` / `-i` to launch the menu-driven TUI. |

---

## Tech Stack

| | Technology |
|---|---|
| Language | TypeScript 5.x (strict mode, ES2022 target) |
| Runtime | Node.js ≥ 18 (ESM, `"type": "module"`) |
| Execution | [tsx](https://github.com/privatenumber/tsx) — runs TypeScript directly, no build step |
| Test framework | Node.js built-in `node:test` + `node:assert/strict` |
| Type declarations | `@types/node ^22` |
| Runtime dependencies | **None** — only `devDependencies` |

---

## Prerequisites

- **Node.js ≥ 18** — required for the native `node:test` runner and ESM support.

---

## Installation

```bash
npm install
```

No compilation step is needed. `tsx` executes TypeScript source directly at runtime.

---

## Usage

### Scripted Simulation

Runs a choreographed scenario and writes output to `scripts/result.txt`:

```bash
npm start
```

The simulation:
1. Adds 3 orders (Normal, VIP, Normal) before any bots exist.
2. Adds 2 bots — they immediately pick up pending orders (VIP first).
3. Waits ~12 seconds, then adds a VIP order (picked up by the idle bot).
4. Waits for all processing to finish, then removes the newest bot.
5. Prints a final summary.

Sample output:
```
[10:05:01] System initialized with 0 bots
[10:05:01] Created Order #1 [Normal] - Status: PENDING
[10:05:02] Created Order #2 [VIP] - Status: PENDING
[10:05:02] Created Order #3 [Normal] - Status: PENDING
[10:05:02] Bot #1 created - Status: ACTIVE
[10:05:02] Bot #1 picked up Order #2 [VIP] - Status: PROCESSING
[10:05:03] Bot #2 created - Status: ACTIVE
[10:05:03] Bot #2 picked up Order #1 [Normal] - Status: PROCESSING
...
Final Status:
- Total Orders Processed: 4 (2 VIP, 2 Normal)
```

### Interactive TUI

Launches a menu-driven REPL:

```bash
npm run start:interactive
# or
npx tsx src/index.ts --interactive
npx tsx src/index.ts -i
```

Before each prompt, a live status bar is displayed:

```
┌────────────────────────────────────────────┐
│  Bots: 2 (1 active)  Pending: 1  Done: 3  │
└────────────────────────────────────────────┘
  1) Add Normal Order
  2) Add VIP Order
  3) Add Bot
  4) Remove Bot
  5) Show pending queue
  6) Show completed orders
  7) Exit
>
```

The TUI also handles piped input (CI-friendly) and `Ctrl+C` for graceful shutdown.

---

## Running Tests

```bash
npm test
```

Uses Node.js's built-in `node:test` runner with `t.mock.timers` to mock `setTimeout`, so the 10-second processing window is instant — no real waiting in tests.

**13 test cases across 6 suites:**

| Suite | Cases |
|---|---|
| `Order` | Sequential ID generation; initial PENDING status for Normal and VIP orders |
| `Priority Queue` | VIP jumps ahead of Normal; VIP queues behind existing VIPs; Normal FIFO ordering |
| `Bot - add bot` | Idle when no orders; picks up order on arrival; picks up VIP before Normal |
| `Bot - order completion` | Order moves to COMPLETE after 10 s; bot picks up next order; bot goes idle when queue empties |
| `Bot - idle bot picks up new order` | Idle bot immediately processes a newly added order |
| `Bot - remove bot` | No-op when no bots exist; decreases bot count; returns in-progress order to PENDING; returned VIP re-inserted at correct position; LIFO removal (newest bot first) |

---

## Project Structure

```
se-take-home-assignment/
├── .github/
│   └── workflows/
│       └── backend-verify-result.yaml  # CI pipeline (runs test → build → run, verifies result.txt)
├── scripts/
│   ├── build.sh                        # Runs npm install
│   ├── run.sh                          # Runs the scripted simulation
│   ├── test.sh                         # Runs the unit test suite
│   └── result.txt                      # Simulation output (gitignored, regenerated by CI)
├── src/
│   ├── index.ts                        # Entry point: scripted simulation + interactive TUI
│   ├── orderManager.ts                 # Core orchestrator (queue, bots, dispatch logic)
│   ├── order.ts                        # Order domain model
│   ├── bot.ts                          # Bot domain model (timer-based processing)
│   └── logger.ts                       # Dual-output logger (stdout + result.txt)
├── tests/
│   └── orderManager.test.ts            # All unit tests (13 cases)
├── package.json
├── tsconfig.json
└── README-ori.md                       # Original assignment brief
```

---

## OrderManager API

The `OrderManager` class is the primary programmatic interface:

| Method | Returns | Description |
|---|---|---|
| `addNormalOrder()` | `Order` | Creates and enqueues a Normal order; dispatches any idle bots. |
| `addVIPOrder()` | `Order` | Creates and enqueues a VIP order (priority insertion behind existing VIPs, ahead of all Normals); dispatches idle bots. |
| `addBot()` | `Bot` | Creates a new bot and immediately assigns a pending order if one exists. |
| `removeBot()` | `Bot \| null` | Destroys the newest bot (LIFO). If it was processing an order, the order is returned to its correct position in the pending queue. Returns `null` if no bots exist. |
| `getStatus()` | `{ bots, pending, completed, activeBots }` | Returns current counts for bots, active bots, pending orders, and completed orders. |
| `getPendingQueue()` | `Order[]` | Returns a shallow copy of the current pending queue. |
| `getCompletedOrders()` | `Order[]` | Returns a shallow copy of all completed orders. |
| `getBots()` | `Bot[]` | Returns a shallow copy of the active bot list. |

---

## Design Decisions

**Priority queue via linear insertion**
VIP orders are inserted by scanning the queue for the last VIP entry — O(n). This is simple and correct for the prototype scale; no heap or sorted structure is needed.

**LIFO bot removal**
`removeBot()` uses `Array.pop()` to always destroy the most recently added bot. This matches the requirement that "the newest bot" is removed.

**Returned order re-enqueued via `_enqueue()`**
When a bot is cancelled mid-order, the order is passed back through the same `_enqueue()` priority logic, guaranteeing it lands in the correct position (VIP orders stay ahead of Normals).

**Timer mocking in tests**
Tests use `t.mock.timers` from `node:test` to tick `setTimeout` forward instantly. This keeps the full suite fast (milliseconds) while testing real timing-dependent behavior. The logger is monkey-patched to a no-op in tests to suppress output.

**No external dependencies**
All functionality is built on Node.js built-ins (`readline`, `node:test`, `node:assert`, `setTimeout`). The only dev tools are `typescript`, `tsx`, and `@types/node`.

**ESM-only**
The project uses `"type": "module"` with `NodeNext` module resolution. All imports use explicit `.js` extensions (resolved to `.ts` at runtime by `tsx`).

---

## CI/CD

The GitHub Actions workflow at `.github/workflows/backend-verify-result.yaml` triggers on pull requests to `main` and:

1. Sets up Node.js 22 (and Go 1.23 per the original repo scaffold).
2. Runs `scripts/test.sh` — all unit tests must pass.
3. Runs `scripts/build.sh` — installs dependencies.
4. Runs `scripts/run.sh` — executes the scripted simulation.
5. Verifies that `scripts/result.txt` exists, is non-empty, and contains at least one `HH:MM:SS` timestamp.
