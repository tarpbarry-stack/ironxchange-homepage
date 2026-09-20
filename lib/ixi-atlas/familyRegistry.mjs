export const atlasFamilies = [
  {
    id: "private", title: "Private inventory", topic: "private", number: "01",
    summary: "Inspect the machine, edit its facts and open the working surfaces attached to it.",
    context: "Private access · Owned sample", faceNames: ["Machine", "Seller details", "Deal sheet", "Network"],
    principle: "Private describes access. Ownership is a separate relationship. This example is an owned machine with private access.",
    faces: [
      ["Review and edit the machine", "Check the title, serial, stock number, hours and location. Press EDIT on the card, change a field, then press SAVE. The sample updates here; RESET restores the starting facts.", "The same Object and Passport remain attached after an edit."],
      ["Write useful seller details", "Use the description editor to explain condition, equipment and known details. Save the description and return to Face 1. The Console can show seller details beside the photo.", "Check the saved text before sharing. The $ control opens financial work in the live product; this lesson captures the launch."],
      ["Review the deal sheet", "Read the machine facts in the deal-sheet format. Compare them with the photo and seller details by opening another Console panel.", "Changing a face changes the view, not the machine or its ownership."],
      ["Read the network surface", "Open the Network face to recognize the surface provided for machine relationships. Use the rail to change the sample's color or outline.", "A rail color is a visual marker. It does not establish ownership, a sale or a payment."],
    ],
    tasks: ["On Face 1, change the hours with EDIT and SAVE. Check the sample receipt below.", "Open a Console on the right. Cycle its face with the bottom actuator; close it with the inside actuator.", "Use Send on the rail. Read the captured action, then RESET and verify the starting facts return."],
    related: ["private", "post-free", "acquisition", "sold"],
  },
  {
    id: "auction", title: "Auction machines", topic: "auction", number: "02",
    summary: "Separate machine facts from the event, prepare a sample bid pack and rehearse closeout.",
    context: "Public access · Auction context", faceNames: ["Machine", "Event & terms", "Dealer bid pack", "Closeout"],
    principle: "An auction lot wraps event and commercial information around the machine. A bid plan is not a submitted bid or proof of ownership.",
    faces: [
      ["Identify the machine and lot", "Check year, make, model, hours and lot number. Use the photo arrows to inspect the sample images, then open Event & terms.", "Confirm that the machine and lot match before reviewing the event."],
      ["Check event terms and source", "Read the auction company, event, lot and available terms. Check payment and removal information against the source before acting. Source links in this practice session are captured.", "The example is fictional. Missing terms must be verified with the auction company; blank does not mean zero."],
      ["Prepare a dealer bid pack", "Edit the available planning fields on the real bid-pack face. Leave a field or press Enter to save the sample plan. Review the resulting figures together with the event terms.", "The practice receipt confirms a local save. This workbench does not submit a bid."],
      ["Rehearse auction closeout", "Choose BOUGHT, ARCHIVE RESULT or DELETE AUCTION LISTING. Read the confirmation, then cancel or confirm. This lesson records the simulated outcome while keeping the sample available.", "BOUGHT is an ownership workflow. Archive retains the result. Permanent listing removal preserves the machine's Passport."],
    ],
    tasks: ["Open Event & terms and match the machine, sample event and lot number.", "Open Dealer bid pack. Change a planning field and leave it; check the sample receipt.", "Open Closeout, choose an action and cancel once. Reopen and confirm to inspect its simulated outcome."],
    related: ["auction", "passport", "acquisition", "transact"],
  },
  {
    id: "reference", title: "URL-imported references", topic: "url-import", number: "03",
    summary: "Review imported source information and work with a reference without claiming ownership.",
    context: "Private access · Non-owned reference", faceNames: ["Machine", "Source notes", "Deal sheet", "Network"],
    principle: "URL import is an origin, not another card family. This example uses the Private card because its saved access is private. A public or auction import can use a different family.",
    faces: [
      ["Review the imported facts", "Compare title, hours, location and photos with the original source. In this sample, use EDIT and SAVE to correct a fact. The non-owned reference status remains unchanged.", "Saving source information does not add the machine to owned inventory."],
      ["Keep source notes clear", "Use the description editor to record what the source states and what still needs verification. Keep uncertain facts explicit. The source address and reference status remain visible above this workbench.", "Editing a reference does not edit the source website or grant ownership of the machine."],
      ["Compare the reference", "Use the deal-sheet face alongside another Console panel to inspect the source facts. Larger Gear Box settings make the original controls easier to inspect.", "The views share one sample identity. Importing another URL is not a reason to create another Passport for the same machine."],
      ["Recognize the relationship", "The Network face and rail provide the same working controls as the underlying card family. Mark or share the reference only through actions available to your account.", "To record an actual purchase, use the authorized acquisition workflow and verify the saved result."],
    ],
    tasks: ["Read the source and NON-OWNED REFERENCE label. Identify one fact you would verify before using it.", "Change the sample hours and save. Check that the Passport and reference status remain the same.", "Open the Console, try another face and use Send. RESET clears your sample changes."],
    related: ["url-import", "bulk-import", "passport", "acquisition"],
  },
];
export function getAtlasFamily(id) { return atlasFamilies.find(family => family.id === id) || atlasFamilies[0]; }

export const familyControls = [
  { id: "identity", name: "Machine identity", selector: ".title-row, .aof1-title", text: "Match year, make and model first. Read the fixed sample Object and Passport in the receipt below; changing a face or card size never creates another machine." },
  { id: "faces", name: "Four working faces", selector: ".rail-flip", text: "Use the face control on the rail to cycle the primary card. The four named buttons above provide direct access. Console panels have their own bottom face actuator." },
  { id: "rail", name: "Machine rail", selector: ".board-command-rail", text: "The rail carries front/back, color, outline, face, Send and armed-destination controls. Colors and outlines update this sample. Delivery and sharing produce a practice receipt." },
  { id: "console", name: "Attached Console", selector: ".ixi-object-card-actuator.right, .ixi-object-card-actuator.left", text: "Open an outside actuator to add a panel. Use its bottom actuator to cycle faces, or the inside actuator to close it. Up to five panels share the same machine. The assembly can shift to a smaller gear as it grows." },
];
