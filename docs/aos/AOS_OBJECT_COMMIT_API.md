# IXI AOS Object Commit API

## Purpose

This endpoint is the trusted integration boundary for API and Chat-assisted AOS object creation.

It does **not** create a second object model. Every successful request converges on the same IX-Core durable provisioning service used by Object Studio, manual Save, and Bulk/Excel.

Permanent creation invariant:

```text
trusted request
  -> signed commit envelope
  -> IX-Core object provisioning
  -> permanent Object
  -> IXI Passport
  -> verified Object <-> Passport identity
  -> TRAN$ACT eligible
```

Customer business meaning remains customer-owned. This contract never branches on business nouns, object names, category labels, field labels, card titles, or container names.

## Endpoint

```text
POST /api/aos/object-commit
```

The route is disabled unless the server has:

```text
IXI_AOS_COMMIT_SECRET
```

configured.

## Authentication

This is a trusted server/integration endpoint, not a browser-public object creation endpoint.

Each request requires:

```text
x-ixi-timestamp: <unix-seconds>
x-ixi-signature: sha256=<hex-hmac>
```

The signature is:

```text
HMAC_SHA256(
  IXI_AOS_COMMIT_SECRET,
  `${timestamp}.${rawRequestBody}`
)
```

The timestamp must be within five minutes of the server clock.

The raw JSON bytes used for signing must be the exact bytes sent in the HTTP body.

Replaying an authentic request does not create another object because `requestId` becomes the stable IX-Core provisioning identity.

## Contract

```json
{
  "contractVersion": "ixi-aos-object-commit-v1",
  "channel": "chat",
  "requestId": "chat-request-stable-id-001",
  "entityId": "entity_...",
  "actorId": "user-or-trusted-principal-id",
  "object": {
    "definitionId": "definition_...",
    "definitionKey": null,
    "displayName": "CUSTOMER PROVIDED NAME",
    "businessIdentifiers": [],
    "fields": {},
    "media": [],
    "cardTemplateSlug": null,
    "cardTemplateVersion": null,
    "metadata": {}
  }
}
```

`channel` may be:

```text
api
chat
```

`requestId` is mandatory and must remain stable across retries of the same intended create operation.

## Identity behavior

A successful create returns the same identity shape as the core provisioning service:

```json
{
  "ok": true,
  "object": {
    "objectId": "object_..."
  },
  "passport": {
    "passportId": "IXI..."
  },
  "identity": {
    "objectId": "object_...",
    "passportId": "IXI..."
  },
  "transact": {
    "eligible": true,
    "objectId": "object_...",
    "passportId": "IXI..."
  }
}
```

The same signed request with the same `requestId` and payload must resolve to the same Object + Passport pair. Reusing the same idempotency identity for conflicting data is rejected by IX-Core.

## Draft doctrine

Chat may help assemble and revise a draft without creating anything.

No permanent AOS identity exists until the user or trusted workflow explicitly commits the completed draft.

Before commit there is no requirement to issue:

```text
objectId
passportId
TRAN$ACT subject
```

The customer-provided object name is required at permanent commit. IXI system placeholders such as `UNTITLED OBJECT` and `NEW OBJECT` are rejected.

## Object Studio

Object Studio emits its existing:

```text
ixi-object-launch-v1
```

payload.

The shared commit adapter converts that launch payload to the same provisioning contract. It also persists the serialized Studio `cardDefinition` on `object.metadata.cardDefinition`. The AOS card runtime already recognizes embedded object card definitions, so the design remains attached to the permanent Object after its draft ID is replaced by the real Object ID.

Once the first Studio launch succeeds, the draft is converted to `edit` mode. Later Studio saves update that same Object and verify that its original Passport identity is unchanged. They do not call permanent creation again.

## Security boundaries

Do not expose `IXI_AOS_COMMIT_SECRET` to browser JavaScript.

Do not accept unsigned caller-supplied `entityId` or `actorId` through this trusted endpoint.

Do not derive authorization from customer business vocabulary.

Do not use this endpoint as a replacement for ordinary signed-in browser AOS authorization. It is specifically for trusted server/API/Chat integrations.
