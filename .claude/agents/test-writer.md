# Test-Writer Subagent Prompt Template

Use this template when dispatching a test-writer subagent (RED phase).

```
Agent tool (general-purpose):
  description: "Write failing tests for: [feature name]"
  prompt: |
    You are writing tests for: [feature name]

    ## Task Description

    [FULL TEXT of the checklist item or task — paste it here]

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

    Write tests that describe the desired behavior.
    Do NOT write any implementation code.

    Steps:
    1. Identify which layer this belongs to
    2. For src/lib/: write Vitest unit tests in `src/lib/**/__tests__/*.test.ts`
       Run: `pnpm vitest run <test_file> 2>&1`
    3. For src/components/: write Vitest + React Testing Library tests in `src/components/**/__tests__/*.test.tsx`
       Run: `pnpm vitest run <test_file> 2>&1`
    4. For src/pages/: write Playwright e2e tests in `e2e/*.spec.ts`
       Run: `pnpm test:e2e <test_file> 2>&1`
       (Requires dev server — start with `pnpm dev` first if needed)
    5. Verify the failure is "not yet implemented" or similar, NOT a compilation error

    ## Rules

    - Do NOT write implementation code
    - Do NOT modify existing tests
    - Test names must describe behavior in Japanese (例: `[[term]] を概念リンクノードに変換する`)
    - Use real code — avoid mocks unless absolutely unavoidable
    - One test = one behavior

    ## Report Format

    When done, report:
    - **Status:** DONE | BLOCKED
    - Tests written (file paths + test names)
    - Failure output (copy actual output from `pnpm vitest run` or `pnpm test:e2e`)
    - Confirmation that each test fails for the right reason
```
