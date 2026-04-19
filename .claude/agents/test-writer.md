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
    1. Identify which layer this belongs to (src/lib/ or src/components/)
    2. For src/lib/: write Vitest unit tests in `src/lib/**/__tests__/*.test.ts`
    3. For src/components/: write Vitest + React Testing Library tests in `src/components/**/__tests__/*.test.tsx`
    4. Run `pnpm test [test_file] 2>&1` to confirm tests FAIL
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
    - Failure output from `pnpm test` (copy actual output)
    - Confirmation that each test fails for the right reason
```
