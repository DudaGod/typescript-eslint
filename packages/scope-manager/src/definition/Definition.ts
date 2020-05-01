import { CatchClauseDefinition } from './CatchClauseDefinition';
import { ClassNameDefinition } from './ClassNameDefinition';
import { FunctionNameDefinition } from './FunctionNameDefinition';
import { ImplicitGlobalVariableDefinition } from './ImplicitGlobalVariableDefinition';
import { ImportBindingDefinition } from './ImportBindingDefinition';
import { ParameterDefinition } from './ParameterDefinition';
import { VariableDefinition } from './VariableDefinition';

type Definition =
  | CatchClauseDefinition
  | ClassNameDefinition
  | FunctionNameDefinition
  | ImplicitGlobalVariableDefinition
  | ImportBindingDefinition
  | ParameterDefinition
  | VariableDefinition;

export { Definition };
