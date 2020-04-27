import { BlockScope } from './BlockScope';
import { CatchScope } from './CatchScope';
import { ClassScope } from './ClassScope';
import { ForScope } from './ForScope';
import { FunctionExpressionNameScope } from './FunctionExpressionNameScope';
import { FunctionScope } from './FunctionScope';
import { GlobalScope } from './GlobalScope';
import { ModuleScope } from './ModuleScope';
import { SwitchScope } from './SwitchScope';
import { WithScope } from './WithScope';

type Scopes =
  | BlockScope
  | CatchScope
  | ClassScope
  | ForScope
  | FunctionExpressionNameScope
  | FunctionScope
  | GlobalScope
  | ModuleScope
  | SwitchScope
  | WithScope;

type BlockNode = Scopes['block'];

export { BlockNode, Scopes };
