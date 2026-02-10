# Insights

## Overview Page Structure

- The overview page (0.4 root) presents a high-level description of the SDK
- Lists three main modules: MWDATCamera, MWDATCore, MWDATMockDevice
- Navigation sidebar shows expandable sections for each module with nested items
- Page uses a simple heading + paragraph format for the main content
- No code examples or detailed API signatures on the overview page itself

## API Reference Page Structure (Classes)

- **Title format:** `{TypeName} Class` as H1, followed by modifiers (e.g., "Modifiers: final")
- **Overview:** Brief description paragraph after modifiers
- **Sections:** Signature, Constructors, Properties, Functions (each as H2)
- **Tables:** Each section uses a table with two columns: name/signature and description
- **Detailed descriptions:** Within table cells, includes:
  - Brief description paragraph
  - Full signature in code block
  - Parameters section with name/type and description
  - Returns section with type and description
- **Cross-references:** Heavy use of internal links to other types (DeviceSelector, StreamSessionConfig, etc.)
- **Publisher types:** Properties with publishers show generic types through context/links (e.g., `AnyPublisher<VideoFrame, Never>`)
- **State transitions:** Explicitly documented for lifecycle methods (start/stop)
- **Error documentation:** Lists all possible error cases with links to error enum
- **Property access modifiers:** Some properties are marked as `[Get]` in the table, indicating get-only (computed) properties
- **Listener pattern:** Classes may expose `add*Listener` methods that return `AnyListenerToken` for cancellation; these are @escaping @Sendable closures
- **Async sequence pattern:** Some methods return `AnyAsyncSequence<T>` for streaming values over time; map to `AsyncIterable<T>` in TypeScript

## TypeScript Conversion Patterns

- Classes with Combine publishers should become event emitter interfaces in TS
- Swift synchronous methods may benefit from Promise wrappers in React Native context
- Publisher subscriptions map to `addListener`/`removeListener` patterns
- Consider factory functions instead of constructors for React Native module instantiation

## API Reference Page Structure (Enums)

- **Title format:** `{EnumName} Enum` as H1, may include "Extends Error" if conforming to Error protocol
- **Overview:** Brief description paragraph
- **Sections:** Signature, Enumeration Constants (each as H2)
- **Constants table:** Two columns - "Member" (case name with associated values) and "Description"
- **Associated values:** Shown inline with case name, e.g., `configurationError(OSStatus)`
- **TypeScript mapping:** Enums with associated values require discriminated unions with `type` field
- **Cross-references in associated values:** Types like `DeviceIdentifier` are linked but may be defined in other modules (e.g., MWDATCore)
- **Playwright extraction:** Table rows accessible via `rowgroup` > `row` > `cell` structure; member column shows full case signature with inline links to associated value types
- **Simple enums:** Some enums have only one or two cases (e.g., VideoCodec with only `raw`); still document fully for completeness
- **Conformance listing:** After title, may show "Extends {Protocols}" (e.g., "Extends Equatable, Sendable") for protocol conformances
- **LinkState pattern:** Simple three-state enum (disconnected/connecting/connected) with no associated values; maps cleanly to TS string literal union
- **Error enums with Properties section:** Some enums (like PermissionError) include a "Properties" section after "Enumeration Constants", typically showing computed properties like `description [Get]`; these are inherited from Error protocol conformance
- **Simple status enums:** Some enums are very simple with just 2-3 cases and no associated values (e.g., PermissionStatus with `granted`/`denied`); these map cleanly to TypeScript string literal unions and benefit from type guard functions in TS for runtime validation
- **State machine enums:** Some enums represent state machines with 4+ ordered states (e.g., RegistrationState: unavailable → available → registering → registered); document the state flow in overview; include helper functions in TS for state description and validation
- **SessionState pattern:** 5-state lifecycle enum (stopped → waitingForDevice → running/paused → unknown) with computed `description` property; TS includes both type guard (`isSessionState`) and description helper function for ergonomic runtime validation and string conversion
- **Error enums with Int raw value:** Some error enums (like WearablesError) extend both Int and Error; in TS, map to discriminated unions with `type` field for exhaustive matching; include Error subclass for throw/catch compatibility; provide helper functions for type guards and error descriptions

## API Reference Page Structure (Namespace Enums)

- **Title format:** `{EnumName} Enum` as H1 (same as regular enums)
- **Pattern:** Some enums are "namespace enums" — Swift pattern using enum with no cases, only static members
- **Enumeration Constants table:** Will be empty (no rows in tbody) for namespace enums
- **Purpose:** Provides namespacing for static APIs without allowing instantiation
- **Example:** `Wearables` enum has no cases but provides `static func configure()` and `static var shared`
- **TypeScript mapping:** Namespace enum → TypeScript `namespace` with static methods, or object with readonly properties
- **Common use:** Entry point/facade patterns where you want static-only API surface

## API Reference Page Structure (Protocols)

- **Title format:** `{ProtocolName} Protocol` as H1
- **Overview:** Brief description paragraph
- **Sections:** Signature, Functions (each as H2) — may also include Properties, Associated Types, etc.
- **Functions table:** Two columns - function name/signature and detailed description with parameters/returns
- **Generic protocols:** May use associated type `T` in Swift; map to TypeScript generic interfaces with type parameter `<T>`
- **@Sendable @escaping closures:** Common pattern for listener callbacks; map to simple TypeScript callbacks `(param: T) => void`
- **AnyListenerToken pattern:** Protocol methods returning `AnyListenerToken` indicate cancellable subscriptions; in TS, model as interface with `cancel(): void` method
- **TypeScript mapping:** Swift protocol → TypeScript `interface`; methods translate directly; generic associated types become type parameters
- **Minimal protocols:** Some protocols are very simple with just 1-2 methods (e.g., AnyListenerToken with only `cancel()`); these represent focused contracts and map cleanly to TypeScript interfaces with the same surface area
- **Properties in protocols:** Protocol properties table shows name and description but NOT type; property types must be inferred from context or linked types in the description; get-only properties shown with `[Get]` modifier
- **Factory method pattern:** Some protocols expose factory methods that return concrete types (e.g., `pairRaybanMeta() -> MockRaybanMeta`); these are synchronous in Swift but should be async (Promise-based) in TS for React Native bridge compatibility
- **Device simulation protocols:** Mock device protocols (e.g., MockDisplaylessGlasses) provide synchronous methods for simulating physical device actions (fold/unfold) and accessing mock capabilities (getCameraKit); all methods should be Promise-wrapped in TS for consistency with React Native bridge patterns; protocol inheritance is explicit in "Extends" section after title
- **Marker protocols:** Some protocols are "marker protocols" with no additional members beyond parent protocol (e.g., MockRaybanMeta extends MockDisplaylessGlasses but adds nothing); these exist for type safety and semantic clarity; in TS, map to type alias of parent interface; consider adding type guard functions for runtime checks even though they're structurally identical

## API Reference Page Structure (Structs)

- **Title format:** `{StructName} Struct` as H1, followed by conformances (e.g., "Extends Sendable")
- **Overview:** Brief description paragraph after conformances
- **Sections:** Signature, Constructors, Properties (each as H2)
- **Constructors table:** Two columns - name/signature and detailed signature with parameters
- **Properties table:** Two columns - property name and description (types inferred from constructor or not shown in table)
- **Property types in table:** Property type information is NOT shown in the properties table; types must be extracted from constructor parameters or may be linked enum/struct types
- **Default initializers:** Some structs provide both parameterized and default (no-args) initializers with documented default values in the description
- **Sendable conformance:** Common for value types that can be safely passed across concurrency boundaries
- **TypeScript mapping:** Structs become plain interfaces; `Data` → `Uint8Array`; `UInt` → `number`; referenced enum types should be imported/defined; consider factory functions for default initializers
- **CoreMedia types:** Swift structs exposing `CMSampleBuffer` or other CoreMedia types should map to opaque native references in TS (number or object handles); prefer exposing higher-level methods like `makeUIImage()` that return TS-friendly types (base64 URI, ArrayBuffer, etc.)
- **Sendable conformance in docs:** Structs marked as `Sendable` can be safely passed across concurrency boundaries; document this in TS but no direct runtime implication
- **Property types in tables:** For structs, the properties table shows property names in the first column and descriptions in the second; types are NOT shown in the table but must be inferred from context (linked types in description) or constructor parameters; for simple value types like `Int`, assume standard mappings; for complex types like `HingeState`, check if it's a linked enum and reference it in docs
- **Value range constraints:** Some Int properties have implicit range constraints (e.g., batteryLevel 0-100); document these in both Swift and TS sections; add validation in TS type guards when appropriate
- **Non-copyable structs (~Copyable):** Some structs like Mutex conform to `~Copyable` (move-only semantics in Swift 6+); these cannot be copied and use `sending` keyword for ownership transfer; in TS, model as class with constructor and methods; document that instances are opaque handles and should not be duplicated; `withLock` pattern uses closure with `inout` parameter for exclusive mutable access

## API Reference Page Structure (Type Aliases)

- **Title format:** `{TypeName} Type Alias` as H1
- **Overview:** Single paragraph description of what the type represents
- **Sections:** Signature only (H2)
- **Signature format:** `public typealias {TypeName} = {UnderlyingType}` in code block
- **Documentation:** Very minimal compared to other types; just declaration and brief description
- **TypeScript mapping:** Type alias → TypeScript `export type` with same name; add type guards for runtime validation if useful
- **Common pattern:** Often used for semantic naming (e.g., `DeviceIdentifier = String`) to make API intent clearer
- **Usage context:** Document where this type alias is commonly used in other APIs (device selection, session management, etc.)
