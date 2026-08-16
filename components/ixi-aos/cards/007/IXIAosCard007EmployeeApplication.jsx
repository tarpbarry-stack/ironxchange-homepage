import IXIAosGenericUniversalLayout007 from "../generic/IXIAosGenericUniversalLayout007";

/*
 * Compatibility export for existing Face Lab/runtime imports.
 * Card 007 is the universal AOS card.
 *
 * IMPORTANT: 007 uses the media geometry defined by the universal renderer
 * itself. Do not layer a card-specific media override on top of it; the
 * universal renderer intentionally matches the full-width 001 media surface.
 */
export default function IXIAosCard007EmployeeApplication(props) {
  return <IXIAosGenericUniversalLayout007 {...props} />;
}
