# Display API (DAT 0.7)

Expo bridge for Meta Ray-Ban Display glasses. See also `.cursor/rules/display-api.mdc`.

## When to use

- User asks about Display, DAM, lenses UI, `sendDisplayContent`, Meta Ray-Ban Display
- Editing `DisplaySessionManager`, `DisplayContentBuilder`, display types, or `damEnabled` plugin prop

## Requirements

- DAT 0.7, `damEnabled: true`, Meta AI V272+, firmware V125+, physical Display glasses
- Session flow: `createSession` → `startSession` → `addDisplayToSession` → wait `started` → `sendDisplayContent`

## JSON → native DSL

JS sends `DisplayContentNode`; native builds SDK UI. Taps return `onDisplayInteraction` with `onPressId` string.

Node types: `flexBox`, `text`, `button`, `image`, `icon` — see `src/EMWDAT.types.ts`.

## Files to edit

- TS: `EMWDAT.types.ts`, `EMWDATModule.ts`, `useMetaWearables.ts`, `EMWDATModule.web.ts`, `index.ts`
- Android: `DisplaySessionManager.kt`, `DisplayContentBuilder.kt`
- iOS: `DisplaySessionManager.swift`, `DisplayContentBuilder.swift`
- Plugin: `plugin/src/index.ts` (`damEnabled`)

## Do not

- Simulate display in MockDeviceKit
- Pass JS callbacks into native for button taps
- Enable Display without DAM config
