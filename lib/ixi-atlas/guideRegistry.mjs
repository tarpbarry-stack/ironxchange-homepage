// Task instructions ship with Atlas only. Header links import helpRoutes.mjs instead.
function guide(id, title, group, summary, steps, result, related, demo = "", coverage = "Quick start") {
  return { id, title, group, summary, steps, result, related, demo, coverage };
}
export const atlasGuides = [
  guide("overview", "Find your way around IronXchange", "Start here", "Start with a machine, then open the workspace for the job you need to do.", [
    ["Choose your work", "Use Marketplace to discover machines, your Dashboard to reach your environments, or AOS / Work to organize company objects."],
    ["Open help where you are", "HELP / ATLAS opens instructions for your page or active tool in a separate tab. Your original work stays open."],
    ["Explore the whole Atlas", "Search any topic or open SYSTEM INDEX. Select a guide for steps, Machine Card for working demonstrations, or Chassis for its blueprint."],
  ], "You can move between all published guides and demonstrations from any starting lesson.", ["marketplace", "account", "machine-card", "aos-work"], "machine"),
  guide("marketplace", "Find and inspect a machine", "Marketplace", "Narrow the machines on screen, inspect their details, and act on the right machine.", [
    ["Narrow the selection", "Use the Marketplace search and available filters. Adjust or clear filters when the expected machine is missing."],
    ["Inspect the card", "Check year, make, model, hours and price. Use the photo arrows and face control to inspect the machine and buyer information."],
    ["Choose the next action", "Open the machine for more details, use the available seller-contact or Send controls, or sign in to save it."],
  ], "Your selected machine remains the subject of its card, details and available actions.", ["machine-card", "saved", "passport"], "machine"),
  guide("machine-card", "Work with the Machine Card", "Machine systems", "Learn the controls once, then recognize the same machine across workspaces.", [
    ["Identify the machine", "Read the year, make and model. Check serial and stock identifiers when the selected face provides them."],
    ["Change your view", "Use the face control on the rail. Face 1 shows the photo; the Marketplace also has buyer, deal-sheet and network faces."],
    ["Try the controls", "Open the demonstration below. INSPECT labels the controls; OPERATE clears the pointers. RESET restores the sample."],
  ], "You can change views without changing the identity of the machine.", ["console", "gearbox", "passport", "private", "auction"], "machine", "Interactive lesson"),
  guide("console", "Open and use a Console", "Machine systems", "Expand the working surfaces attached to the selected machine.", [
    ["Open a side", "Use a side actuator on the Machine Card to open the adjacent Console."],
    ["Choose the module face", "Use the bottom actuator on a Console panel to cycle that panel's working face. The primary Machine Card remains in place."],
    ["Adjust or close", "Use outside actuators to expand, inside actuators to collapse, and Gear Box to adjust the assembled size. The Marketplace demonstration supports five panels including the machine."],
  ], "The Console stays attached to the machine that opened it.", ["machine-card", "gearbox", "transact"], "console", "Interactive lesson"),
  guide("gearbox", "Change card size with Gear Box", "Machine systems", "Choose the amount of detail and working room you need.", [
    ["Find the size control", "The plus, gear number and minus form one size control. Gear 1 is largest; Gear 7 is smallest."],
    ["Adjust the size", "Press plus to make the card larger or minus to make it smaller. The number changes while the control stays in place."],
    ["Open more working space", "Console expansion can shift to a smaller size to fit the assembled panels. The card keeps its selected face and identity."],
  ], "You control the density of the workspace without creating another machine.", ["machine-card", "console"], "gearbox", "Interactive lesson"),
  guide("passport", "Understand the IXI Passport", "Machine systems", "One Object and one Passport identify the machine across its commercial uses.", [
    ["Check the Passport", "Use the machine's Passport number when matching its record across IronXchange."],
    ["Distinguish identity from presentation", "A public listing, auction lot, private card or non-owned URL reference can describe the same machine. The presentation does not grant ownership."],
    ["Explore the sample", "Switch the commercial context in the Passport demonstration. The displayed Object and Passport remain unchanged."],
  ], "You can recognize the same machine while its access, relationship or commercial context changes.", ["machine-card", "private", "auction", "url-import"], "identity", "Interactive lesson"),
  guide("aos-work", "Organize work in AOS", "Workspaces", "Find company objects and work with them on the Board.", [
    ["Choose your index", "Use the available System Index selection to find Equipment, Locations, Workforce or your named indexes."],
    ["Open the right object", "Select a container or object and check its identity. Related views can point to the same machine and Passport."],
    ["Use the movement controls", "Use Board, Recall and Return for the selected object where available. Check the resulting placement. Moving a view does not create identity or establish ownership."],
  ], "Your workspace presents the same authorized objects through their existing relationships.", ["pockets", "passport", "machine-card", "transact"], "chassis"),
  guide("pockets", "Use pockets and active stacks", "Workspaces", "Stage supporting work beside the Board where the workspace provides these destinations.", [
    ["Choose a destination", "Locate the side pockets or top and bottom active stacks in your workspace."],
    ["Arm before delivery", "Select the intended destination, then use the machine's armed-delivery control. Confirm that the target is available before sending."],
    ["Inspect the result", "Open the destination to see its contents. The Chassis blueprint explains the stations; it is not a live copy of your workspace."],
  ], "You know where work is staged and which destination will receive the next command.", ["aos-work", "machine-card", "console"], "chassis"),
  guide("private", "Find and work with your inventory", "Inventory", "Use your inventory to inspect and operate on machines you are authorized to manage.", [
    ["Find the machine", "Open Inventory and use the available search and filters to locate the machine."],
    ["Confirm identity and access", "Check its year, make, model and identifiers before editing. Use only the actions available to your account."],
    ["Review after saving", "Save through the card's editing workflow and check the confirmed result. Use SOLD for completed sales rather than treating a sold machine as available inventory."],
  ], "You are working on the intended machine with its current access and inventory state.", ["machine-card", "passport", "sold", "post-free"], "family:private", "Interactive lesson"),
  guide("auction", "Read a machine in auction context", "Inventory", "An auction lot adds event and commercial information around the machine.", [
    ["Check the event", "Read the event, lot information and available terms on the auction card."],
    ["Inspect the machine", "Review the machine details and source information. Use the controls available in that auction environment."],
    ["Keep identity separate", "Use the Passport to recognize the machine across contexts. This Atlas lesson explains the context; it does not place bids."],
  ], "You can distinguish machine facts from the lot and event information around them.", ["passport", "machine-card"], "family:auction", "Interactive lesson"),
  guide("post-free", "Create a machine listing", "Inventory", "Prepare the machine facts and media, then review before posting.", [
    ["Enter the machine facts", "Complete year, make, model, hours and price. Add serial, stock, location and descriptive details where provided."],
    ["Add and review media", "Upload the correct machine photos and check the preview. Confirm that the facts and images belong to the same machine."],
    ["Complete the available save action", "Review the selected access and commercial settings, submit the listing, and wait for confirmation before leaving."],
  ], "A confirmed saved listing can be found in your inventory. A preview alone is not a saved machine.", ["private", "passport", "bulk-import", "url-import"]),
  guide("url-import", "Bring in a machine from a URL", "Inventory", "Turn source information into a reviewed working reference.", [
    ["Provide the source", "Paste the source machine URL into URL Import and start the import's review step."],
    ["Review the extracted information", "Check machine identity, facts and photos against the source. Correct missing or incorrect information before saving."],
    ["Confirm the result", "Complete the authorized save or import action and verify the resulting card. A non-owned source reference does not grant ownership."],
  ], "The reference retains its source context and uses the resolved machine identity.", ["passport", "private", "bulk-import"], "family:reference", "Interactive lesson"),
  guide("bulk-import", "Review a bulk machine import", "Inventory", "Check the batch before committing machine records.", [
    ["Choose the input", "Use the upload format offered by Bulk Import and provide your machine data."],
    ["Review each row", "Check the field mapping, required facts, media and validation results. Resolve flagged rows and identity conflicts."],
    ["Confirm and inspect results", "Submit the reviewed rows through the import controls. Read the per-row outcomes before retrying any failures."],
  ], "You know which rows saved and which still require attention.", ["post-free", "url-import", "private"]),
  guide("transact", "Start a transaction in TRAN$ACT", "Financial work", "Choose the correct company or machine before opening a financial worksheet.", [
    ["Select the subject", "Choose the company or machine in the left toolbar. Verify the title and identifiers in the selected-object area."],
    ["Review existing work", "Use Transaction History to inspect records already attached to the selected subject. Open a record to return to its worksheet."],
    ["Open the appropriate app", "Choose an app or + NEW for a new transaction. Use the worksheet tabs to move between open work, and save through that worksheet's controls."],
  ], "The transaction belongs to the intended subject and remains discoverable from its history.", ["invoice", "payments", "acquisition", "freight", "ledger"]),
  guide("invoice", "Work with an invoice", "Financial work", "Check the subject, customer, amounts and payment status before acting.", [
    ["Open the invoice", "Select the machine or company, then open the invoice from Transaction History. Verify the invoice number, customer and machine identifiers."],
    ["Review the amounts", "Check the sale or service details, dates, charges and any linked trade credit. Use the worksheet's available save action after authorized edits."],
    ["Record money received", "Use RECORD MONEY RECEIVED or the payment controls for the selected invoice. Enter the actual date, amount and method, then confirm the updated balance and PAID, PART PAID or UNPAID status."],
  ], "The saved invoice and recorded receipts explain the remaining balance. Check the confirmed status before treating it as paid.", ["payments", "sales-order", "settlement", "sold"]),
  guide("quote", "Prepare and revisit a quote", "Financial work", "Connect the customer and machine to a clear proposal.", [
    ["Select the subject", "Open Quote for the intended machine or company. In Sales Desk, begin from the appropriate customer deal."],
    ["Prepare the proposal", "Review customer details, equipment, price, dates and terms. Save using the worksheet controls."],
    ["Review before sharing", "Open the saved version, verify its contents, and use the available delivery action. Reopen the same quote when revisions are needed."],
  ], "The saved quote is available for review and the next commercial step.", ["sales-order", "transact", "sales-desk"]),
  guide("sales-order", "Review a sales order", "Financial work", "Confirm the agreed machine, customer and terms before advancing the sale.", [
    ["Open the correct order", "Use the selected machine's Transaction History or Sales Order app. Check the customer and identifiers."],
    ["Review the agreement", "Check price, dates, terms and linked trade information before using the signature or acceptance workflow."],
    ["Verify the next record", "After the required signing or confirmation step, inspect the resulting invoice and its balance. An order alone does not prove that money has been received."],
  ], "The order and its linked invoice describe the same sale.", ["quote", "invoice", "payments", "settlement"]),
  guide("payments", "Record and verify a payment", "Financial work", "Record the money movement against the correct transaction.", [
    ["Select the transaction", "Open the invoice, expense or other payable/receivable record. Confirm the subject and outstanding balance."],
    ["Enter the payment facts", "Use RECORD PAYMENT or RECORD MONEY RECEIVED as appropriate. Enter the actual amount, date and method, then review before saving."],
    ["Check the saved result", "Wait for confirmation. Verify the remaining balance and payment status in the record and Transaction History. If saving is uncertain, inspect history before submitting again."],
  ], "The payment record and remaining balance agree with the money actually paid or received.", ["invoice", "transact", "ledger", "sold"]),
  guide("acquisition", "Record a machine acquisition", "Financial work", "Capture how the machine entered inventory and the associated acquisition facts.", [
    ["Confirm the machine and source", "Open Asset Acquisition for the correct machine. Verify its Passport and the party providing it."],
    ["Review acquisition details", "Enter the acquisition date, value and applicable ownership or payoff information. Review any linked trade before saving."],
    ["Keep follow-on work separate", "Save the acquisition and inspect its record. Use the separate freight and work-order workflows for transport and make-ready costs."],
  ], "The machine has a traceable acquisition record with its source and date.", ["private", "freight", "work-order", "invoice"]),
  guide("freight", "Set up and revisit freight", "Financial work", "Keep transport details attached to the correct machine.", [
    ["Open Freight", "Select the machine, then open Freight from its TRAN$ACT apps or reopen the saved Freight record."],
    ["Enter the movement", "Review pickup, delivery, parties, dates and transport details. Add the expected price when known."],
    ["Save and verify", "Save the worksheet, inspect its recorded details, and use the available document or delivery actions when needed."],
  ], "The saved Freight record describes the intended transport for that machine.", ["transact", "acquisition", "payments"]),
  guide("work-order", "Create and follow a work order", "Financial work", "Describe the work against the correct machine or operating subject.", [
    ["Choose the subject and app", "Select the machine or other permitted subject, then choose Work Order or Tech Work Order as appropriate."],
    ["Describe the job", "Record the work, responsible parties, dates and available labor or material details. Review the subject before saving."],
    ["Reopen the saved job", "Use Transaction History to inspect the existing record and its current status before creating another order for the same work."],
  ], "The job is traceable from the subject's records.", ["transact", "private", "payments"]),
  guide("settlement", "Review a sale for settlement", "Financial work", "Reconcile the sale's records before completing settlement.", [
    ["Open the sale's records", "Confirm the machine, buyer, invoice and receipts belong to the intended sale."],
    ["Review the settlement", "Inspect proceeds, obligations and the worksheet's settlement details. Resolve discrepancies before using a completion action."],
    ["Confirm the final state", "Complete settlement only when the required work is done. Verify the saved settlement status in the sale records and SOLD view."],
  ], "The sale's settlement status reflects its confirmed financial work.", ["invoice", "payments", "sold", "ledger"]),
  guide("ledger", "Use Executive and Ledger Control", "Financial work", "Review company financial information in the selected accounting period.", [
    ["Confirm the scope", "Open Executive / Ledger Control and verify the company and accounting period."],
    ["Choose the workspace", "Use Executive, A/R, A/P, Treasury, GL / Close or Reporting for the question you need to answer."],
    ["Inspect the source record", "Drill into a record when available. Resolve missing or failed data before relying on a displayed total. Period-closing actions are separate from viewing reports."],
  ], "You can connect the selected period's financial view to its underlying transactions.", ["transact", "payments", "invoice"]),
  guide("sold", "Review sold machines and totals", "Inventory", "Find completed sales and inspect their details and settlement state.", [
    ["Set the date scope", "Open SOLD and choose the date range. Review the sale count and total sold value for that scope."],
    ["Open the machine", "Search or select its tile. Check sale date, price, buyer, seller and settlement information."],
    ["Inspect before correcting", "Open the connected record for detail. If the sale is wrong, review the available reverse-sale workflow and its confirmation before proceeding."],
  ], "The scoreboard and selected sale describe the date scope and machine you are reviewing.", ["invoice", "payments", "settlement", "private"]),
  guide("sales-desk", "Organize sales work", "Workspaces", "Keep customers, machines, deals and next actions together.", [
    ["Choose the customer or deal", "Use the contact and deal controls to open existing work or create a permitted new record."],
    ["Bring in the machines", "Select the relevant machine tiles and inspect them on the board. Check the active deal before linking work or preparing a quote."],
    ["Set the next action", "Record a follow-up or appointment, save it, and review the calendar or daily work view. Fold the side toolbars when you need more board space."],
  ], "The deal has the right customer, machines and next action.", ["calendar", "quote", "machine-card", "transact"]),
  guide("calendar", "Plan and review appointments", "Workspaces", "Use the Sales Desk calendar to keep commitments visible.", [
    ["Choose the view", "Open Calendar and use the month, day or agenda view. Check the date and displayed time zone."],
    ["Create the commitment", "Use + APPOINTMENT, enter the meeting or follow-up details, and save. Review the saved entry."],
    ["Review changes", "Open an event to inspect it. When moving an appointment, review the new date, time and any overlap notice before confirming."],
  ], "Your calendar shows the saved commitment in the intended date and time scope.", ["sales-desk"]),
  guide("account", "Use your Dashboard", "Workspaces", "Reach your machines and working environments from one place.", [
    ["Choose an environment", "Use the application links for AOS / Work, TRAN$ACT, Inventory, SOLD, Sales Desk, Theater or Launch."],
    ["Open a machine", "Use the available inventory or relationship tiles to bring the selected machine into the working area."],
    ["Manage your account", "Use Profile and the account controls for company and account settings. Save active edits before leaving a working environment."],
  ], "You can reach the right workspace and return to the machine you need.", ["private", "aos-work", "transact", "sales-desk"]),
  guide("saved", "Revisit saved machines", "Marketplace", "Keep a shortlist of machines you want to return to.", [
    ["Sign in", "Saving machines requires your account. Public browsing and inspection remain available without saving."],
    ["Save the intended machine", "Use its Save control, then open Saved to revisit the shortlist."],
    ["Review current details", "Open the saved machine and check its latest information before contacting the seller or making a decision."],
  ], "Your shortlist lets you return to the same machines.", ["marketplace", "machine-card", "account"], "machine"),
  guide("theater", "Inspect machines in Theater", "Workspaces", "Use a focused environment to review selected machines.", [
    ["Choose the machines", "Open Theater and use the available selection controls to bring the intended machines into view."],
    ["Inspect the details", "Review photos and machine information. Use the card controls available in this environment."],
    ["Return to your task", "Continue in the appropriate machine or workspace when you are ready to act."],
  ], "You have a clearer view of the machines under consideration.", ["machine-card", "marketplace", "sales-desk"], "machine"),
  guide("tickets", "Describe an issue clearly", "Support", "Give support enough context to find and reproduce the problem.", [
    ["Start from the affected page", "Use the available ticket control and identify the page and action you were attempting."],
    ["Describe the result", "Explain what you expected and what actually happened. Include the relevant record identifier and a screenshot when appropriate."],
    ["Check submission status", "Use the ticket's submit controls and verify its recorded status. A draft is not proof of a submitted ticket."],
  ], "The recorded issue identifies the affected workflow and the behavior to investigate.", ["overview"]),
];
export function getAtlasGuide(id) { return atlasGuides.find(item => item.id === id) || atlasGuides[0]; }
