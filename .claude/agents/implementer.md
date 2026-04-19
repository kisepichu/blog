# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent (GREEN phase).

```
Agent tool (general-purpose):
  description: "Implement: [feature name]"
  prompt: |
    You are implementing: [feature name]

    ## Task Description

    [FULL TEXT of the checklist item or task — paste it here]

    ## Failing Tests to Make Pass

    [List the test names and file paths from the test-writer agent's report]

    ## Architecture

    ```
    src/lib/          — Build pipeline logic (pure TS, no Astro/React imports)
      remark/         — remark/rehype plugins
      build/          — Index generators (preview-index, backlink graph)
      content/        — Content schema, type definitions
    src/components/   — React / Astro components
    src/pages/        — Astro pages
    ```

    Rule: src/lib/ must NOT import Astro or React.

    ## Your Job

    Write the minimal implementation to make the failing tests pass.

    Steps:
    1. Read the failing tests to understand the required behavior
    2. Write the minimal code needed — no extra features, no speculative abstractions
    3. Run the target tests to confirm they PASS:
       - src/lib/ or src/components/: `pnpm vitest run <test_file> 2>&1`
       - src/pages/ (e2e): `pnpm test:e2e <test_file> 2>&1`
    4. Run `pnpm test 2>&1` to confirm ALL unit/component tests still pass
    5. Fix any regressions before reporting back

    ## Rules

    - Write only what is needed to pass the tests
    - Do NOT modify existing tests
    - YAGNI: do not add features not required by the tests
    - Follow existing code patterns
    - src/lib/ must not import Astro or React

    ## Self-Review Before Reporting

    - [ ] Target tests pass
    - [ ] All unit/component tests still pass (`pnpm test` clean)
    - [ ] e2e tests pass if applicable (`pnpm test:e2e`)
    - [ ] No over-engineering beyond what tests require
    - [ ] src/lib/ has no Astro/React imports

    ## Report Format

    When done, report:
    - **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED
    - What you implemented (files changed)
    - Test output (copy actual output showing tests pass)
    - Any concerns or caveats
```
