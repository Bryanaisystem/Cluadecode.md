// Purpose: Generates a random integer between 3 and 7 to randomize the delay before a
// follow-up, so outreach doesn't look robotically scheduled.
// Where it goes: before a Wait/Delay node in the follow-up sequence — feed `number`
// into the Wait node's duration field.

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
