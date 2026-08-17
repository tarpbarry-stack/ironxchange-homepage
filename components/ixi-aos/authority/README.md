# IXI Authority

IXI Authority is the object-neutral access-control foundation for AOS and TRAN$ACT.

The browser may project decisions for usability, but IX-Core is authoritative. Never rely on hidden React controls as the security boundary.

`IXIAuthorityRegistry` owns canonical capability names. `IXIAuthorityContract` owns normalized policy/rule shapes. `IXIAuthorityEvaluator` is deterministic and defaults to deny. `IXIAuthorityClient` is the server transport. `IXIAuthorityAdapter` gives AOS/TRAN$ACT a compact runtime interface. The TRAN$ACT `ACCESS / POLICY` module is the administration surface.

Customer nomenclature is presentation. Labels such as Employee, Mechanic, Welder, Confidential, Yard, or any other user-defined term must never be parsed to infer authority semantics.
