# AOS Object Definition Lifecycle

## Purpose

Object Definitions are reusable customer-owned schema/capability contracts. They are not inferred from an Object name, card header, container name, customer category, or IXI business vocabulary.

The customer decides whether an Object should participate in a reusable Definition. A normal named Object may remain definition-less and still be a valid permanent AOS Object.

## Explicit definition intent

Object Studio only creates or updates a reusable Definition when the launch Object contains an explicit definition intent:

```json
{
  "metadata": {
    "definitionDraft": {
      "enabled": true,
      "label": "CUSTOMER SUPPLIED LABEL",
      "definitionKey": "customer-supplied-stable-key",
      "syncFieldSchema": true,
      "capabilities": {},
      "businessIdentifierSchema": null,
      "metadata": {}
    }
  }
}
```

`label` and `definitionKey` are customer/domain configuration. They are not derived from equipment, employee, job, yard, truck, welder, or any other IXI noun.

## Create flow

1. Studio remains a browser draft.
2. Customer gives the Object its durable name.
3. If `definitionDraft.enabled !== true`, no reusable Definition mutation occurs.
4. If explicit definition intent is enabled:
   - normalize Studio field definitions into the MOS `fieldSchema` contract;
   - resolve an existing active Definition by `definitionId` or stable `definitionKey`;
   - reject conflicting ownership of a stable key;
   - otherwise create the customer Definition;
   - write the resulting `definitionId` / `definitionKey` into the launch payload.
5. Permanent Object provisioning runs through the existing Object + Passport + TRAN$ACT boundary.

Definition creation does not create a second Object birth path.

## Edit flow

A permanent Object edit first re-reads the authoritative Object and verifies tenant ownership and its existing Passport.

Object Studio may synchronize an explicitly selected existing Definition. It may not silently swap a permanent Object onto another Definition. Definition reassignment requires a future audited IX-Core reassignment command.

The edit must preserve:

- `objectId`
- `entityId`
- Passport identity
- existing Object `definitionId`

## Field schema normalization

Studio fields remain presentation/editing objects. At the Definition boundary they normalize to stable MOS fields:

- `fieldId` -> `field`
- label
- type
- required
- editable
- importable
- exportable
- apiAddressable
- searchable
- presentationOrder
- metadata

No field value is moved into Definition storage. Definitions describe schema; Objects own values.

## Idempotency / retries

Before Definition creation, Studio lists active Definitions and reuses an existing Definition with the same stable key. A stable-key collision with a different label fails closed with `AOS_DEFINITION_KEY_CONFLICT`.

Permanent Object creation remains idempotent through the existing AOS provisioning command/draft identity.

## Doctrine

- Customer business meaning is authoritative.
- Object identity and reusable Definition identity are separate.
- Naming an Object never automatically creates a type.
- Definition schema never owns Object field values.
- Card presentation never becomes business truth.
- Templates fork presentation; they do not own the created Object.
- IXI supplies durable identity, schema, capability, security, and lifecycle infrastructure.
