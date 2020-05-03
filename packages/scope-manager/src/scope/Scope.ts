import { BlockScope } from './BlockScope';
import { CatchScope } from './CatchScope';
import { ClassScope } from './ClassScope';
import { ForScope } from './ForScope';
import { FunctionExpressionNameScope } from './FunctionExpressionNameScope';
import { FunctionScope } from './FunctionScope';
import { GlobalScope } from './GlobalScope';
import { ModuleScope } from './ModuleScope';
import { SwitchScope } from './SwitchScope';
import { TypeScope } from './TypeScope';
import { WithScope } from './WithScope';

type Scope =
  | BlockScope
  | CatchScope
  | ClassScope
  | ForScope
  | FunctionExpressionNameScope
  | FunctionScope
  | GlobalScope
  | ModuleScope
  | SwitchScope
  | TypeScope
  | WithScope;

type BlockNode = Scope['block'];

export { BlockNode, Scope };
