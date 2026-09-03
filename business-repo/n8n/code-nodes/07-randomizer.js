// Purpose: Generates a random integer between 3 and 7 to randomize the delay before a
// follow-up, so outreach doesn't look robotically scheduled.
// Where it goes: before a Wait/Delay node in the follow-up sequence — feed `number`
// into the Wait node's duration field.
//
// Real-implementation note: in the live `Outreach System.json`, this code runs verbatim
// (4 copies, one per parallel lane) but its `number` output is NOT wired into any Wait
// node's amount — the downstream "Wait" node it feeds has a hardcoded amount of 1 with
// no unit set (n8n defaults to seconds). The named cadence-spacing Wait nodes further
// down each lane ("3 Day Wait", "2 Day wait", "2 day Wait", "1 day wait") have the same
// problem: amount 1, no unit, so they also wait ~1 second, not days. As exported, the
// whole 4-touch cadence fires back-to-back in seconds rather than spread across a week.
// Fix both: set each Wait node's unit to "days" with the intended amount, and either
// wire this node's `number` into the jitter Wait's amount or remove it if unused.

const min = 3;
const max = 7;

const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

return [
  {
    json: {
      number: randomNumber
    }
  }
];
