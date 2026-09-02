# Permanent AOS Creation Receipt

A permanent creation caller may report success only after the authoritative response proves all of the following for one identity tuple:

```text
entityId
  └─ objectId
       ├─ Passport identity → passportId
       └─ TRAN$ACT eligibility → same objectId + passportId
```

`assertAosCreationReceipt()` is the frontend/server integration invariant for this tuple.

It intentionally does not inspect customer business vocabulary. A customer may call an Object anything and may use any Definition/Fields/Faces they choose. Permanent identity is technical and channel-independent.

The creation channel is provenance only: `container-plus`, `object-studio`, `bulk-import`, `api`, or `chat`.

No channel is permitted to invent its own permanent Object class or bypass IX-Core provisioning.
