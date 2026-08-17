import IXIAosGenericUniversalLayout007B from "../generic/IXIAosGenericUniversalLayout007B";

/*
 * 007B — universal AOS card without the bottom child/photo thumbnail rail.
 * All object semantics, editing, relationships, commands, skins and rail behavior
 * remain owned by the shared universal 007 implementation.
 */
export default function IXIAosCard007B(props) {
  return <IXIAosGenericUniversalLayout007B {...props} />;
}
