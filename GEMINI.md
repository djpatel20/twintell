# twintell — Project Rules & Guidelines for Gemini

Welcome to **twintell**!

Always adhere to the comprehensive project instructions and architecture documented in:
1. [`AGENTS.md`](file:///C:/Users/patel/.gemini/antigravity-ide/scratch/twintell/AGENTS.md): Master instructions, build order, roles, and authorization rules.
2. [`ARCHITECTURE.md`](file:///C:/Users/patel/.gemini/antigravity-ide/scratch/twintell/ARCHITECTURE.md): System architecture, database constraints, and module structure.
3. [`API_SPEC.md`](file:///C:/Users/patel/.gemini/antigravity-ide/scratch/twintell/API_SPEC.md): Full REST API contracts, parameters, and error formats.
4. [`.agents/rules/product_rules.md`](file:///C:/Users/patel/.gemini/antigravity-ide/scratch/twintell/.agents/rules/product_rules.md): Core authorization and role enforcement.
5. [`.agents/rules/build_order.md`](file:///C:/Users/patel/.gemini/antigravity-ide/scratch/twintell/.agents/rules/build_order.md): Vertical slice steps and checkpoint rules.
6. [`.agents/rules/design_system.md`](file:///C:/Users/patel/.gemini/antigravity-ide/scratch/twintell/.agents/rules/design_system.md): Colors, layout breakpoints, and component styling.

## Essential Constraints
- **Role Enforcement**: A `USER` can NEVER create or edit posts/products. Always enforce on the backend.
- **Workflow**: Announce plan & files -> Execute step -> STOP and give test instructions -> Wait for "continue".
- **Performance**: Cursor pagination only, no N+1 queries, atomic counter increments in Prisma transactions.
