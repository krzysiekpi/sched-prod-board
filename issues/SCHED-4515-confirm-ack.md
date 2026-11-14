---
id: SCHED-4515
title: Ack asks to confirm, naming the incident
status: done
plan: R7
---

From product, after watching the recording at 00:09: a new incident arrived while the pointer rested on
an Ack button, the rows moved, and the click acked INC-7267 instead of INC-7334.

Decision: new incidents stay live at the top and Ack stays on the row, but Ack asks to confirm, and the
confirm names the incident id.

- Clicking Ack opens a confirm (`data-testid="confirm"`) that names the incident id; it reads the id at
  click time.
- `confirm-ack` sends `api.ack(id)` and marks the row acked; `confirm-cancel` closes it with no ack.

Acceptance: click Ack while a new incident pushes the rows down; the confirm names the incident whose
button was clicked, and Cancel leaves everything un-acked.
