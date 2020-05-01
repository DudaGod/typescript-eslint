import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Definition } from './definition';
import { Reference } from './Reference';
import { Scope } from './scope';

/**
 * A Variable represents a locally scoped identifier. These include arguments to
 * functions.
 * @class Variable
 */
class Variable {
  /**
   * List of defining occurrences of this variable (like in 'var ...'
   * statements or as parameter), as custom objects.
   */
  public readonly defs: Definition[] = [];
  /**
   * True if the variable is considered used for the purposes of `no-unused-vars`, false otherwise.
   */
  public eslintUsed?: boolean;
  /**
   * List of defining occurrences of this variable (like in 'var ...'
   * statements or as parameter), as AST nodes.
   */
  public readonly identifiers: TSESTree.Identifier[] = [];
  /**
   * The variable name, as given in the source code.
   */
  public readonly name: string;
  /**
   * List of {@link Reference} of this variable (excluding parameter entries)
   * in its defining scope and all nested scopes. For defining occurrences only see {@link Variable#defs}.
   */
  public readonly references: Reference[] = [];
  /**
   * Reference to the enclosing Scope.
   */
  public readonly scope: Scope;
  /**
   * Whether this is a stack variable.
   */
  public stack = true;
  /**
   * Whether the variable comes from a dynamic scope (such as 'eval', 'with', etc.), and may be trapped by dynamic scopes.
   */
  public tainted = false;

  constructor(name: string, scope: Scope) {
    this.name = name;
    this.scope = scope;
  }
}

export { Variable };
