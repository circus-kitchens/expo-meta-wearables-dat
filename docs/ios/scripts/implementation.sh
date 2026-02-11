#!/usr/bin/env bash
set -euo pipefail

# for i in {1..20}; do
#   echo "=== Run $i/20 ==="
#   ./docs/ios/scripts/implementation.sh 2>&1 | tee "./docs/ios/logs/run_$i.txt"
# done

## Prerequisites
# - Give permission to this script: chmod +x ./docs/ios/scripts/implementation.sh


PROMPT=$'
## Context:
You are implementing a TypeScript Expo Module for the Meta Wearables Device Access Toolkit (iOS). Specifically, version 0.4.

## Goal:
The goal is to create a robust package and expose the required values, methods, and types to the TypeScript side. Always trying to follow the best practices and patterns.

## Task:
1) Open @docs/implementation-plan.md.
2) Find the FIRST STEP marked with [❌].
3) Load the @docs/implementation-insights.md file to see if theres any relevant info about the structure of the docs that can help you with step. This file was populated by the previous step of the implementation plan.
4) Ask questions to the user to help you with the implementation of the step.
5) Implement the step.
6) Update the @docs/implementation-plan.md file to mark the step as [✅].
7) Update the @docs/implementation-insights.md file with the new insights (only if you found any relevant info).

## Hard constraints:
- Exactly one step per run.
- Do not modify other steps.
- If no [❌] steps remain, output exactly: <promise>COMPLETE</promise> and exit.

## Documentation:
1. @docs/ios/0.4
2. A previous (working but not optimal) version can be found in @old_package/meta-wearables
3. You have access to Context7 MCP to get access to up to date documentation.
'

claude --permission-mode acceptEdits --model claude-opus-4-6 -p "$PROMPT"
