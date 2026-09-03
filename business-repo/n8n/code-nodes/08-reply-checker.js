// Purpose: Given a Gmail thread object (from a Gmail -> Thread -> Get node), determines
// whether a lead replied like a human, didn't reply, or only sent an auto-reply
// (out-of-office etc.) so follow-up automation doesn't treat an auto-reply as a
// real conversation.
// Where it goes: right after the Gmail "Get Thread" node, before the branching logic
// that decides to send a follow-up or stop.
// Output: { result: 1 | 2 | 3 } — 1 = real reply, 2 = no reply, 3 = auto reply.
// Wire into a Switch node: real reply -> stop follow-ups/alert operator; no reply ->
// continue sequence; auto-reply -> treat as no reply but maybe suppress notifications.
//
// Real-implementation note: this code runs verbatim, unmodified, in all 16 copies
// across the 4 parallel lanes of the live `Outreach System.json` — no drift there. But
// the actual Switch wiring diverges from the guidance above: both result=1 (real reply)
// AND result=3 (auto-reply) currently terminate the sequence (each just fires an
// internal notification email to the operator's own inbox and stops); only result=2
// (no reply) continues on to the next follow-up. Confirm whether auto-reply should
// keep behaving like a real reply (as built) or be switched to continue the sequence
// like no-reply (as this file's own comment recommends) — this is a real behavioral
// choice to make, not a bug to silently fix.

const thread = items[0].json;

let result = 2;

const autoReplyKeywords = [
  "out of office",
  "automatic reply",
  "auto-reply",
  "autoreply",
  "away from the office",
  "on vacation",
  "on holiday",
  "in holiday",
  "i'm on holiday",
  "i am on holiday",
  "i'm in holiday",
  "i am in holiday",
  "ooo"
];

function getHeader(msg, name) {
  const h = (msg.payload?.headers || [])
    .find(h => h.name.toLowerCase() === name.toLowerCase());
  return h?.value?.toLowerCase() || "";
}

const msgs = thread.messages || [];

if (msgs.length <= 1) {
  return [{ json: { result } }];
}

for (let i = 1; i < msgs.length; i++) {
  const msg = msgs[i];

  const snippet = (msg.snippet || "").toLowerCase();
  const labels = (msg.labels || []).map(l => l.id || l);

  if (labels.includes("SENT")) {
    continue;
  }

  const isKeywordAutoReply = autoReplyKeywords.some(k =>
    snippet.includes(k)
  );

  const autoSubmitted = getHeader(msg, "Auto-Submitted");
  const xAutoReply = getHeader(msg, "X-Autoreply");
  const precedence = getHeader(msg, "Precedence");

  const isHeaderAutoReply =
    autoSubmitted.includes("auto") ||
    xAutoReply === "yes" ||
    precedence === "bulk";

  const isVeryShort = snippet.split(" ").length <= 6;

  if (isHeaderAutoReply || isKeywordAutoReply || isVeryShort) {
    result = 3;
    break;
  }

  result = 1;
  break;
}

return [{ json: { result } }];
