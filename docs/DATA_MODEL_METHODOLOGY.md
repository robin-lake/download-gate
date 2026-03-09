# Data model methodology (AI‑friendly)

Use this when designing or changing the backend data model so the AI can reason about it reliably.

## Why this format

- **Single source of truth** – One place (this repo’s data model doc) that both you and the AI use.
- **Explicit structure** – Sections and tables are easy for the AI to parse and reference.
- **Domain-first** – We describe entities, attributes, and relationships in plain language before code.
- **Stable references** – You can say “see DATA_MODEL.md” or `@docs/DATA_MODEL.md` in chats so the AI loads the right context.

## How to work with the AI on the data model

1. **Keep the data model doc in the repo**  
   Maintain `docs/DATA_MODEL.md` (or the current data model doc) and update it when you add or change entities, attributes, or relationships.

2. **Point the AI at it**  
   When asking for backend work, API design, or migrations, reference the doc, e.g.  
   “Using `@docs/DATA_MODEL.md`, add an endpoint for …”  
   That gives the AI the full picture without you pasting it every time.

3. **Iterate in small steps**  
   - Propose one entity or one relationship at a time.  
   - Ask the AI to: “Add this to DATA_MODEL.md and suggest DynamoDB keys/indexes” (or the equivalent for your store).  
   - Then implement (tables, handlers, types) in a follow-up.

4. **Use the same names in code**  
   Keep entity and attribute names in the doc aligned with TypeScript types, API fields, and DB attributes. The doc then doubles as a glossary and reduces ambiguity.

5. **When in doubt, document it**  
   If you’re unsure about an edge case (e.g. “can a DownloadGate exist without a User?”), add a short note in the data model doc (e.g. under the entity or in an “Invariants / rules” section). The AI can then respect those rules when generating code.

## Document structure to use (for DATA_MODEL.md)

- **Overview** – One paragraph on what the system stores and the main entities.
- **Entities** – One subsection per entity. For each:
  - **Description** – What it represents.
  - **Attributes** – Table: name, type, constraints, notes.
  - **Identifiers** – Primary key and any secondary/index keys (e.g. DynamoDB partition/sort keys, GSIs).
  - **Relationships** – How it links to other entities (e.g. “belongs to User”, “has many SmartLinks”).
- **Invariants / business rules** – Short bullet list of rules that must always hold (e.g. “every DownloadGate has an owner user_id”).
- **Changelog** – Optional: date and one-line summary of changes so the AI knows what’s current.

Use clear headings and tables; avoid long prose so the AI can quickly find entity and attribute definitions.

## Where to put the data model

- **Path**: `docs/DATA_MODEL.md` (or `docs/data-model.md`).
- **Cursor**: You can add a project rule that says “When implementing backend types, APIs, or DB access, consult `docs/DATA_MODEL.md` so types and keys match the documented model.” That makes the data model part of the AI’s default context for backend work.

Once this is in place, you can say things like “extend the data model with X” or “implement the DownloadGate API from DATA_MODEL.md” and get consistent, aligned results.
