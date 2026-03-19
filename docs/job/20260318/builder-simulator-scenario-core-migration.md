# Builder Simulator Scenario Core Migration

## Summary

- Date: `2026-03-18`
- Scope: `/admin/builder` scenario simulator execution path
- Goal: keep `ChatbotEngine.ts` unchanged and make `useChatFlow.js` work as the React/UI adapter for `@chatbot/scenario-core`

## Background

The simulator previously ran on `useChatFlow-bak.js`, which directly owned most of the scenario execution behavior. During the migration to `core/scenario-core`, execution responsibility moved into `ChatbotEngine.ts`, and `useChatFlow.js` was rewritten around the engine.

The main issue found during analysis was not that the engine could not execute nodes, but that the old UI contract was no longer being satisfied by the new hook. In particular:

- interactive nodes were not always pushed into simulator `history`
- slot updates produced inside engine execution were not always synchronized back into builder store state
- some simulator UI logic still assumed the old `history` item shape

Because `ChatbotEngine.ts` must remain unchanged, the required fixes belong in `useChatFlow.js`.

## Current Responsibility Split

### `ChatbotEngine.ts`

`ChatbotEngine.ts` should own pure scenario execution behavior:

- scenario graph traversal
- next node resolution
- interpolation helpers
- condition evaluation
- `setSlot`, `delay`, `scenario`, `branch`, `toast`, `link` execution decisions
- API/LLM branching through callback return values

This layer should stay framework-agnostic and should not know about React component state shape.

### `useChatFlow.js`

`useChatFlow.js` should own adapter behavior between engine execution and simulator UI:

- create and refresh the engine instance from `nodes` and `edges`
- transform engine callbacks into simulator `history` items
- keep `currentId`, `fixedMenu`, `isStarted` in sync with the engine state
- bridge async integrations such as API and LLM calls
- synchronize engine-produced slots into `useBuilderStore`
- accept user interaction and re-enter engine execution through `getNextNode()` and `run()`

In short, `useChatFlow.js` is no longer the execution engine. It is the UI/runtime adapter.

## What `useChatFlow-bak.js` Used To Do

The old file was more than a hook. It was the full simulator runtime. Its responsibilities are worth keeping because they explain what the new adapter still has to preserve.

### 1. Graph traversal and flow control

`useChatFlow-bak.js` owned direct movement through the builder graph.

- it inspected `nodes` and `edges` directly
- it selected the next edge using `sourceHandle`, default handles, and fallback edges
- it evaluated branch conditions for `branch(CONDITION)` nodes
- it evaluated LLM keyword conditions for `llm` nodes
- it handled parent group escape when a child node had no outgoing edge
- it stopped execution correctly for interactive nodes

This logic lived mainly in `proceedToNextNode()`.

### 2. Node-type execution dispatch

The old runtime mapped node types to executor functions through `executorMap` and `nodeExecutors.js`.

Examples:

- `message`, `form`, `slotfilling`, `branch(BUTTON)` rendered visible bot bubbles
- `delay` waited and then advanced
- `setSlot` mutated slot state and advanced
- `fixedmenu` replaced the visible history with the fixed menu UI
- `scenario` and `selectionGroup` entered child graphs
- `link` opened a URL and still produced a visible history entry
- `toast` displayed a notification and advanced

The old hook therefore controlled both flow and node behavior.

### 3. History construction and chaining

The old simulator built the exact `history` shape expected by the renderer.

- visible nodes were wrapped into `bot` items
- each item stored `combinedData`
- chain execution used `activeChainId`
- `chainNext` appended multiple logical nodes into a single visual bubble
- interactive nodes remained open until the user answered
- system termination messages were shown through the same history path

This is the most important legacy contract. Even after moving execution into `scenario-core`, the renderer still expects this `history` format.

### 4. Async node integration

The old hook directly handled async nodes that could not be expressed as pure traversal.

#### API nodes

- interpolated URL, headers, and body from slots
- supported single and multi API execution
- parsed JSON response bodies
- mapped response paths into slots
- showed loading items in history
- emitted bot-visible error messages
- branched through `onSuccess` and `onError`

#### LLM nodes

- interpolated prompts from slots
- called Gemini streaming endpoint
- accumulated streamed chunks
- saved final content into `outputVar`
- showed loading items
- wrote visible error messages
- continued flow after success or error

These behaviors still need to exist, but they now sit behind engine callbacks rather than inside graph traversal logic.

### 5. Simulator-specific UI state

The old hook managed several pieces of state that the engine should not own:

- `history`
- `currentId`
- `fixedMenu`
- `isStarted`
- `activeChainId`

It also understood how those states interacted with:

- `ChatbotSimulator.jsx`
- `MessageHistory.jsx`
- `MessageRenderer.jsx`

This remains a hook responsibility even after the migration.

### 6. Start node bootstrap and reset behavior

`useChatFlow-bak.js` also handled simulator lifecycle.

- found the effective start node
- reset slots when simulation started
- cleared fixed menu and history
- restarted execution from a clean runtime state
- reset local simulator state whenever `nodes` or `edges` changed

These are still required in the new hook.

## What Became Unnecessary After Scenario Core Adoption

Once `scenario-core` is in use, these responsibilities should not be re-implemented inside `useChatFlow.js`:

- direct branch condition evaluation logic
- direct graph traversal across `edges`
- parent group fallback traversal logic
- executor dispatch through `executorMap`
- generic node execution behavior for `message`, `delay`, `setSlot`, `scenario`, `selectionGroup`, `toast`, `link`

Those belong to `ChatbotEngine.ts` now.

## What Must Stay In `useChatFlow.js`

Even after adopting `scenario-core`, the following responsibilities remain necessary in `useChatFlow.js`:

- `pushBotNode`-style history shaping
- simulator-specific `fixedMenu` handling
- slot synchronization from engine result back into builder store
- API callback implementation
- LLM callback implementation
- link and toast browser-side behavior
- restart/reset logic for the simulator
- re-entry after user input through `getNextNode()`

If these responsibilities are removed, the engine may still execute correctly, but the simulator UI will appear broken.

## Recommended Adapter Rules For `useChatFlow.js`

The migration should follow these rules:

1. Treat `ChatbotEngine` as the source of truth for execution order.
2. Treat `useChatFlow.js` as the source of truth for simulator rendering state.
3. Never duplicate graph traversal in the hook if the engine already provides it.
4. Always convert engine-visible nodes into the renderer-compatible `history` shape.
5. Always write `result.slots` back to builder store after `engine.run()`.
6. Keep fixed menu as an explicit simulator-only exception.

## Impacted Files

- `app/(siderbar-header)/admin/builder/components/controllers/hooks/useChatFlow.js`
- `app/(siderbar-header)/admin/builder/components/controllers/hooks/useChatFlow-bak.js`
- `app/(siderbar-header)/admin/builder/components/ChatbotSimulator.jsx`
- `app/(siderbar-header)/admin/builder/components/simulator/MessageHistory.jsx`
- `app/(siderbar-header)/admin/builder/components/simulator/MessageRenderer.jsx`
- `core/scenario-core/src/engine/ChatbotEngine.ts`

## Notes

- `useChatFlow-bak.js` should remain as the behavioral reference during the migration period.
- `ChatbotEngine.ts` is intentionally not modified in this change path.
- Any future cleanup should remove only duplicated hook-side execution logic, not the UI adapter responsibilities.
