# IXI Authority Frontend Bridge

TRAN$ACT Access / Policy calls IX-Core only through same-origin Next.js API routes.

The browser does not receive IX-Core credentials and does not supply roles, grants, denies, ancestor chains, or trusted entity context. The proxy reads the IXI Cognito access token only from an HttpOnly session cookie (`ixi_cognito_access_token` or the legacy `ixi_access_token`) and forwards it as a Bearer token to IX-Core.

Set `IXI_CORE_INTERNAL_URL` in the server runtime to the internal IX-Core origin. `IXI_CORE_URL` is accepted as a fallback. Local development defaults to `http://127.0.0.1:4100`.

The UI remains read-only unless `/authority/access-context` reports `authority.manage` in the authenticated principal grants.
