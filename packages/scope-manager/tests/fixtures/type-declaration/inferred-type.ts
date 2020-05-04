type T = never extends Map<infer U, string> ? U : never;

type Unresolved = U;
