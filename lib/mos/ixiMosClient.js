/*
 * AOS/MOS browser compatibility facade.
 *
 * All browser AOS reads and writes now pass through the
 * authenticated Next.js gateway. The gateway resolves the real
 * Sharetribe session, derives the Entity server-side, and signs
 * the internal request to IX-Core.
 *
 * Keep this module path stable so existing AOS consumers inherit
 * the security boundary without each inventing transport logic.
 */
export * from "./ixiMosBrowserGatewayClient";
