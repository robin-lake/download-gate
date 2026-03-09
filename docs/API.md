# REST API

The backend exposes a REST API documented with **OpenAPI 3**.

## Interactive docs (Swagger UI)

With the backend running (e.g. `npm run dev` in `backend/`):

- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)  
  Browse and try endpoints from the browser.

- **OpenAPI JSON**: [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)  
  Raw OpenAPI 3 spec for codegen, tooling, or import into Postman/Insomnia.

## Auth

All `/api/users` endpoints except the Clerk webhook require **Clerk authentication**. Send the Clerk session token in the `Authorization` header:

```http
Authorization: Bearer <clerk_session_token>
```

In Swagger UI, use “Authorize” and enter your Bearer token to call protected endpoints.

## Base URL

- Local: `http://localhost:3000`
- Staging/Production: set by deployment (see CDK or env).

## Keeping docs in sync

The spec is generated from **JSDoc** in the route files (`backend/src/app.ts`, `backend/src/routes/*.ts`). When you add or change routes, add or update the `@openapi` JSDoc block above each handler so the spec and Swagger UI stay accurate.
