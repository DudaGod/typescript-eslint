enum DefinitionType {
  // eslint-disable-next-line @typescript-eslint/internal/prefer-ast-types-enum
  CatchClause = 'CatchClause',
  ClassName = 'ClassName',
  FunctionName = 'FunctionName',
  ImplicitGlobalVariable = 'ImplicitGlobalVariable',
  ImportBinding = 'ImportBinding',
  Parameter = 'Parameter',
  Type = 'Type',
  Variable = 'Variable',
}

/**
 * The DefinitionTypes that are valid in a type context
 */
const TypeDefinitionTypes = new Set([
  DefinitionType.ClassName,
  DefinitionType.Type,
]);

/**
 * The DefinitionTypes that are valid in a value context
 */
const ValueDefinitionTypes = new Set([
  DefinitionType.CatchClause,
  DefinitionType.ClassName,
  DefinitionType.FunctionName,
  DefinitionType.ImplicitGlobalVariable,
  DefinitionType.ImportBinding,
  DefinitionType.Parameter,
  DefinitionType.Variable,
]);

export { DefinitionType, TypeDefinitionTypes, ValueDefinitionTypes };
