// Parcel supports importing shaders with .glsl, .vert, or .frag extensions right out of the box.
// TypeScript (and therefore VS Code), however, have no idea about this extra feature. This file
// tells TypeScript to interpret any .glsl, .vert, or .frag files as if they were modules.
// Specifically, it says to treat each one as a module with a single, default export of type
// `string`.

declare module '*.glsl' {
    const value: string;
    export default value;
}

declare module '*.vert' {
    const value: string;
    export default value;
}

declare module '*.frag' {
    const value: string;
    export default value;
}
