from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"{label} marker not found")
    return text.replace(old, new, 1)


# Finish worksheet footer after the base migration reaches the legacy queue label.
p = Path('components/ixi-tickets/IXITicketWorksheet.jsx')
s = p.read_text()
s = s.replace('>SUBMIT TO CHAT QUEUE</button>', '>ADD TO READY QUEUE</button>')
old = '''        {!locked ? <button type="button" className={styles.readyButton} disabled={syncing} onClick={markReady}>ADD TO READY QUEUE</button> : null}
      </footer>'''
new = '''        {!locked ? <button type="button" className={styles.readyButton} disabled={syncing} onClick={markReady}>ADD TO READY QUEUE</button> : null}
        {!locked ? <button type="button" className={styles.readyButton} disabled={syncing} onClick={sendToAgentNow}>SEND TO AGENT NOW</button> : null}
      </footer>'''
if 'SEND TO AGENT NOW' not in s:
    s = replace_once(s, old, new, 'worksheet send-now footer')
p.write_text(s)


# Command: work one Ticket, work the Ready queue, lifecycle-safe closeout, dual ratings.
p = Path('components/ixi-tickets/IXITicketCommand.jsx')
s = p.read_text()
target = 'import { IXI_TICKET_STATUS } from "../../lib/ixi-tickets/IXITicketContract";\n'
imp = 'import { startRemoteTicket } from "../../lib/ixi-tickets/ixiTicketClient";\n'
if imp not in s:
    s = replace_once(s, target, target + imp, 'command start import')

old = '''  const [verifyNote, setVerifyNote] = useState("");
  const [closeoutDraft, setCloseoutDraft] = useState(closeoutForm(null));'''
new = '''  const [verifyNote, setVerifyNote] = useState("");
  const [userScore, setUserScore] = useState("");
  const [agentScore, setAgentScore] = useState("");
  const [agentConfidence, setAgentConfidence] = useState("");
  const [agentRatingNote, setAgentRatingNote] = useState("");
  const [closeoutDraft, setCloseoutDraft] = useState(closeoutForm(null));'''
if 'const [userScore' not in s:
    s = replace_once(s, old, new, 'command rating state')

old = '''    setVerifyNote("");
    setActionNotice("");
  }, [selected?.ticketId, selected?.revision]);'''
new = '''    setVerifyNote(selected?.metadata?.userReview?.note || "");
    setUserScore(selected?.metadata?.userReview?.score ? String(selected.metadata.userReview.score) : "");
    setAgentScore(selected?.closeout?.agentRating?.score ? String(selected.closeout.agentRating.score) : "");
    setAgentConfidence(selected?.closeout?.agentRating?.confidence ? String(selected.closeout.agentRating.confidence) : "");
    setAgentRatingNote(selected?.closeout?.agentRating?.note || "");
    setActionNotice("");
  }, [selected?.ticketId, selected?.revision]);'''
if 'setUserScore(selected?' not in s:
    s = replace_once(s, old, new, 'command rating hydration')

marker = '''  async function submitCloseout() {'''
fn = '''  async function startWork(ticket = selected, source = "single-ticket") {
    if (!ticket || actionBusy) return;
    setActionBusy(true);
    setActionNotice("");
    try {
      await startRemoteTicket(ticket, { assignedTo: "chat", source });
      setActionNotice(`STARTED ${ticket.displayNumber} — status is now WORKING.`);
      await refreshRemoteTickets();
    } catch (error) {
      setActionNotice(error.message || "Ticket could not be started.");
    } finally {
      setActionBusy(false);
    }
  }

  async function startAllReady() {
    if (actionBusy) return;
    const ready = tickets.filter(ticket => [IXI_TICKET_STATUS.READY_FOR_CHAT, IXI_TICKET_STATUS.REOPENED].includes(ticket.status));
    if (!ready.length) {
      setActionNotice("No Tickets are waiting in the Ready queue.");
      return;
    }
    setActionBusy(true);
    setActionNotice("");
    const failures = [];
    let started = 0;
    try {
      for (const ticket of ready) {
        try {
          await startRemoteTicket(ticket, { assignedTo: "chat", source: "ready-queue" });
          started += 1;
        } catch (error) {
          failures.push(`${ticket.displayNumber}: ${error.message}`);
        }
      }
      await refreshRemoteTickets();
      setActionNotice(failures.length
        ? `Started ${started} Ticket(s). ${failures.length} failed: ${failures.join(" | ")}`
        : `Started all ${started} Ready Ticket(s).`);
    } finally {
      setActionBusy(false);
    }
  }

'''
if 'async function startAllReady()' not in s:
    s = replace_once(s, marker, fn + marker, 'command queue functions')

old = '''        prs: nonEmpty(selected.closeout?.prs)
      });'''
new = '''        prs: nonEmpty(selected.closeout?.prs),
        agentRating: {
          score: agentScore ? Number(agentScore) : null,
          confidence: agentConfidence ? Number(agentConfidence) : null,
          note: agentRatingNote.trim()
        }
      });'''
if 'agentRating: {' not in s:
    s = replace_once(s, old, new, 'command agent rating submit')

old = '''      await approveTicket(selected, verifyNote.trim());'''
new = '''      if (!userScore) {
        setActionNotice("Rate the completed Ticket from 1 to 5 before closing it.");
        return;
      }
      await approveTicket(selected, { score: Number(userScore), note: verifyNote.trim() });'''
if 'Rate the completed Ticket' not in s:
    s = replace_once(s, old, new, 'command user rating approval')

old = '''          <button onClick={() => createTicket({ mode: "floating" })}>+ CREATE TICKET</button>
          <a href="/account">DASHBOARD</a>'''
new = '''          <button onClick={() => createTicket({ mode: "floating" })}>+ CREATE TICKET</button>
          <button onClick={startAllReady} disabled={actionBusy || counts.ready === 0}>{actionBusy ? "WORKING..." : `WORK READY QUEUE (${counts.ready})`}</button>
          <a href="/account">DASHBOARD</a>'''
if 'WORK READY QUEUE' not in s:
    s = replace_once(s, old, new, 'command work ready queue button')

anchor = '<button onClick={() => openTicket(selected.ticketId, "floating")}>OPEN WORKSHEET</button>'
if 'START WORK ON THIS TICKET' not in s:
    add = '''{[IXI_TICKET_STATUS.READY_FOR_CHAT, IXI_TICKET_STATUS.REOPENED].includes(selected.status) ? (
                    <button disabled={actionBusy || !Number.isInteger(selected.revision)} onClick={() => startWork(selected)}>START WORK ON THIS TICKET</button>
                  ) : null}
                  ''' + anchor
    s = replace_once(s, anchor, add, 'command single start button')

# Existing label may already have been clarified earlier; support both forms.
old_variants = [
'''                    <button disabled={actionBusy || !Number.isInteger(selected.revision) || selected.status === IXI_TICKET_STATUS.CLOSED} onClick={submitCloseout}>
                      {actionBusy ? "SUBMITTING..." : "SUBMIT WORK FOR VERIFICATION"}
                    </button>''',
'''                    <button disabled={actionBusy || !Number.isInteger(selected.revision) || selected.status === IXI_TICKET_STATUS.CLOSED} onClick={submitCloseout}>
                      {actionBusy ? "SUBMITTING..." : "SUBMIT WORK FOR VERIFICATION"}
                    </button>'''
]
new = '''                    <button
                      disabled={actionBusy || !Number.isInteger(selected.revision) || ![IXI_TICKET_STATUS.WORKING, IXI_TICKET_STATUS.PR_OPEN].includes(selected.status)}
                      onClick={submitCloseout}
                      title={[IXI_TICKET_STATUS.WORKING, IXI_TICKET_STATUS.PR_OPEN].includes(selected.status) ? "Submit completed work for verification" : "Ticket must be WORKING before closeout"}
                    >
                      {actionBusy ? "SUBMITTING..." : [IXI_TICKET_STATUS.WORKING, IXI_TICKET_STATUS.PR_OPEN].includes(selected.status) ? "SUBMIT COMPLETED WORK FOR VERIFICATION" : "START WORK BEFORE CLOSEOUT"}
                    </button>'''
if 'START WORK BEFORE CLOSEOUT' not in s:
    matched = False
    for old in old_variants:
        if old in s:
            s = s.replace(old, new, 1)
            matched = True
            break
    if not matched:
        raise SystemExit('command closeout button marker not found')

old = '''                  <div className={styles.closeoutEditorGrid}>
                    <label><span>FILES CHANGED — ONE PER LINE</span><textarea value={closeoutDraft.filesChanged} onChange={event => patchCloseout("filesChanged", event.target.value)} /></label>
                    <label><span>TESTS — ONE PER LINE</span><textarea value={closeoutDraft.tests} onChange={event => patchCloseout("tests", event.target.value)} /></label>
                  </div>'''
new = '''                  <div className={styles.closeoutEditorGrid}>
                    <label><span>FILES CHANGED — ONE PER LINE</span><textarea value={closeoutDraft.filesChanged} onChange={event => patchCloseout("filesChanged", event.target.value)} /></label>
                    <label><span>TESTS — ONE PER LINE</span><textarea value={closeoutDraft.tests} onChange={event => patchCloseout("tests", event.target.value)} /></label>
                  </div>
                  <div className={styles.closeoutEditorGrid}>
                    <label><span>AGENT RESULT — 1 TO 5</span><select value={agentScore} onChange={event => setAgentScore(event.target.value)}><option value="">NOT RATED</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
                    <label><span>AGENT CONFIDENCE — 1 TO 5</span><select value={agentConfidence} onChange={event => setAgentConfidence(event.target.value)}><option value="">NOT RATED</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
                    <label><span>AGENT CLOSEOUT NOTE</span><textarea value={agentRatingNote} onChange={event => setAgentRatingNote(event.target.value)} placeholder="Agent assessment of result, completeness, or remaining risk" /></label>
                  </div>'''
if 'AGENT RESULT — 1 TO 5' not in s:
    s = replace_once(s, old, new, 'command agent rating fields')

old = '''              <section className={styles.verification}>
                <label>
                  <span>VERIFICATION / REOPEN NOTE</span>
                  <textarea value={verifyNote} onChange={event => setVerifyNote(event.target.value)} placeholder="What still needs work, or what you verified..." />
                </label>'''
new = '''              <section className={styles.verification}>
                <label>
                  <span>YOUR RESULT RATING — 1 TO 5</span>
                  <select value={userScore} onChange={event => setUserScore(event.target.value)} disabled={selected.status !== IXI_TICKET_STATUS.READY_TO_VERIFY}>
                    <option value="">RATE RESULT</option>
                    {[1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}
                  </select>
                </label>
                <label>
                  <span>YOUR VERIFICATION / REOPEN NOTE</span>
                  <textarea value={verifyNote} onChange={event => setVerifyNote(event.target.value)} placeholder="What you verified, or what still needs work..." />
                </label>'''
if 'YOUR RESULT RATING' not in s:
    s = replace_once(s, old, new, 'command user rating fields')

old = '''                  <p>REV {Number.isInteger(selected.revision) ? selected.revision : "LOCAL"} · {upper(selected.syncState)}</p>'''
new = '''                  <p>REV {Number.isInteger(selected.revision) ? selected.revision : "LOCAL"} · {upper(selected.syncState)}</p>
                  <p>STATUS: {upper(selected.status)}{selected.metadata?.execution?.assignedTo ? ` · ASSIGNED: ${upper(selected.metadata.execution.assignedTo)}` : ""}</p>'''
if 'ASSIGNED:' not in s:
    s = replace_once(s, old, new, 'command execution status')

p.write_text(s)
