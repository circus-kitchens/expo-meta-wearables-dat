#!/usr/bin/env bash
set -euo pipefail

# for i in {1..43}; do
#   echo "=== Run $i/43 ==="
#   ./docs/ios/scripts/extract-docs.sh 2>&1 | tee "./docs/ios/0.4/logs/run_$i.txt"
# done

## Prerequisites
# - Install Playwright MCP: https://github.com/microsoft/playwright-mcp
# - Allow Claude to access the Playwright MCP.
# - Give permission to this script: chmod +x ./docs/ios/scripts/extract-docs.sh


PROMPT=$'
@docs/ios/0.4/index.md

Context:
You are documenting a Swift Package: Meta Wearables Device Access Toolkit (iOS). Specifically, version 0.4.
These docs are for Swift/iOS developers, but we are ALSO building a TypeScript module around this package.

Goal:
For each parsed doc page, produce a markdown file that is great for Swift readers AND ends with a ready-to-use TypeScript section containing converted types/enums/interfaces.
Use Playwright MCP to get access to the content of the page.

Task:
1) Open @docs/ios/0.4/index.md.
2) Find the FIRST URL marked with [❌].
3) Load the insights.md file to see if theres any relevant info about the structure of the docs that can help you with step.
4) Fetch that URL and extract the API details.
5) Create a proper .md file inside docs/meta-wearables-dat-ios/0.4 for that URL. If there is a subsection, add it to a specific subfolder (e.g.: ## MWDATCamera -> docs/meta-wearables-dat-ios/0.4/MWDATCamera.md).
   - Name it sensibly based on the page (prefer the main Swift type name; otherwise use a URL slug).

Markdown content requirements (Swift):
- Title (main Swift symbol)
- URL (the one you fetched)
- Overview
- Swift API surface:
  - Types involved (class/struct/enum/protocol)
  - Key methods + signatures
  - Key properties + types
  - Initializers / configuration objects
  - Errors (error types + cases)
  - Constants, flags, option sets
  - Lifecycle/async/threading notes (if present)
- At least one short Swift usage example if the doc page includes enough context

***MANDATORY: TypeScript section at the very end***
Append a final section exactly titled:

## TypeScript

In that section include:
1) A brief bullet list of notes (1-6 bullets max) about mapping Swift -> TS (optionals, async, naming).
2) A SINGLE fenced code block with language tag `ts` that contains ONLY TypeScript code we can copy/paste.

VERY IMPORTANT: The name of the events, properties, methods, types, and overall structure in the TS code block should be as close as possible to the Swift API, while still being idiomatic TypeScript. The goal is to make it easy for developers to understand the mapping between the two languages and to use the TS types as a reference when working with the Swift package.

The TS code block MUST include, when applicable:
- `export type ...` for Swift enums (convert cases to idiomatic TS string literal unions; keep mapping notes in comments if needed)
- `export type ...` unions for error cases
- `export interface ...` for Swift structs / value objects (with optional fields marked `?`)
- `export type ...` aliases for simple mappings
- Any constants as `export const ...`
- Doc comments (`/** ... */`) for public items

Conversion rules:
- Swift `String` -> `string`
- Swift `Int`, `Int32`, `Int64`, `UInt*` -> `number`
- Swift `Double`, `Float` -> `number`
- Swift `Bool` -> `boolean`
- Swift `Data` -> `Uint8Array` (or `ArrayBuffer` if more appropriate; choose one and be consistent within the file)
- Swift arrays `[T]` -> `T[]`
- Swift dictionaries `[K: V]` -> `Record<string, V>` unless key is clearly numeric
- Swift optional `T?` -> `T | null` OR `T?` in interface fields (choose the more idiomatic one per context and be consistent inside the TS block)
- If the Swift API uses async/await or callbacks, annotate the TS side as Promise-based.

Do NOT include placeholder TS like `any` unless absolutely unavoidable; prefer `unknown` with a comment.

5) After writing the .md file, update ONLY that URL line in @docs/ios/0.4/index.md: change [❌] to [✅].
6) If you find any relevant info for the scrapping process, please add a short note in the @docs/ios/0.4/insights.md file. This could be about patterns in the docs, edge cases, or anything that could help future runs go smoother.
7) End the session immediately after marking it [✅].

Hard constraints:
- Exactly one URL per run.
- Do not modify other URLs.
- Do not touch files outside docs/meta-wearables-dat-ios/ and the index file.
- If no [❌] URLs remain, output exactly: <promise>COMPLETE</promise> and exit.
'

claude --permission-mode acceptEdits --model claude-sonnet-4-5-20250929 -p "$PROMPT"
