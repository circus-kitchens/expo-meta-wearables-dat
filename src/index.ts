// Reexport the native module. On web, it will be resolved to EMWDATModule.web.ts
// and on native platforms to EMWDATModule.ts
export { default } from "./EMWDATModule";
export { default as EMWDATView } from "./EMWDATView";
export * from "./EMWDAT.types";
