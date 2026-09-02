# AOS Creation Channels

Creation channel is provenance, not Object type.

| Channel | Permanent class created | Durable intent key |
|---|---|---|
| Container + / Save | IXI Object | draft ID |
| Object Studio | IXI Object | Studio draft ID |
| Bulk CSV/XLSX | IXI Object | import job + row key |
| Trusted API | IXI Object | request ID |
| Trusted Chat | IXI Object | request ID |

Every row terminates at the same IX-Core provisioning contract and must return the same Object + Passport + TRAN$ACT identity receipt.
