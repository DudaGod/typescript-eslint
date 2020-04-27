declare module 'estraverse' {
  const Syntax: Record<string, string>;
  const VisitorKeys: Record<string, string[]>;
  const VisitorOption: Record<string, {}>;

  export {
    Syntax,
    // traverse,
    // replace,
    // attachComments,
    VisitorKeys,
    VisitorOption,
    // Controller,
    // cloneEnvironment,
  };
}
