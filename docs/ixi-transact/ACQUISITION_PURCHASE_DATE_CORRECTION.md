# Acquisition purchase date correction

The saved acquisition's amendment form previously offered cost fields only.
Changing an amendment's effective date did not change the original purchase
date or the financial document's business date. A purchase entered after a
historical sale could therefore continue to appear as available inventory.

The acquisition record now displays Purchase Date and a Correct Date control.
Purchase Date is also available in the existing amendment selector. The date
form requests the corrected purchase date, a reason, and a source reference.

The command rereads the canonical acquisition and requires the displayed
revision. It updates the original document, acquisition record, metadata, and
financial line dates together. The correction appends old/new dates and actor
evidence; existing cost amendments and original audit history remain intact.
Costs, funding, ownership, totals, references, Object/Passport identity, and
the sale remain unchanged. Successful, verified responses notify Inventory
and Sold to refresh through the existing inventory event mechanism.

No machine-specific rules or changes to inventory event ordering are involved.
A genuine acquisition after a sale still restores available inventory. No
production acquisition date is selected or changed by this code release.

Verification includes the pinned backend's actual acquisition validation and
inventory projection, date/evidence validation, preservation of canonical
fields, and stale/failed/unverified saves. The existing paired release gate
and frontend production build are required. Browser acceptance verifies the
saved record exposes the new control; an actual date correction requires the
operator's intended purchase date.
