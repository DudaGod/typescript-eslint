import { TSESTree } from '@typescript-eslint/experimental-utils';
import {
  Definition,
  TypeDefinitionTypes,
  ValueDefinitionTypes,
} from './definition';
import { Reference } from './referencer/Reference';
import { Scope } from './scope';

/**
 * A Variable represents a locally scoped identifier. These include arguments to functions.
 */
class Variable {
  /**
   * The array of the definitions of this variable.
   * @public
   */
  public readonly defs: Definition[] = [];
  /**
   * True if the variable is considered used for the purposes of `no-unused-vars`, false otherwise.
   * @public
   */
  public eslintUsed = false;
  /**
   * The array of `Identifier` nodes which define this variable.
   * If this variable is redeclared, this array includes two or more nodes.
   * @public
   */
  public readonly identifiers: TSESTree.Identifier[] = [];
  /**
   * The variable name, as given in the source code.
   * @public
   */
  public readonly name: string;
  /**
   * List of {@link Reference} of this variable (excluding parameter entries)  in its defining scope and all nested scopes.
   * For defining occurrences only see {@link Variable#defs}.
   * @public
   */
  public readonly references: Reference[] = [];
  /**
   * Reference to the enclosing Scope.
   */
  public readonly scope: Scope;

  constructor(name: string, scope: Scope) {
    this.name = name;
    this.scope = scope;
  }

  /**
   * `true` if the variable is valid in a type context, false otherwise
   */
  public isTypeVariable(): boolean {
    return this.defs.some(def => TypeDefinitionTypes.has(def.type));
  }

  /**
   * `true` if the variable is valid in a value context, false otherwise
   */
  public isValueVariable(): boolean {
    return this.defs.some(def => ValueDefinitionTypes.has(def.type));
  }
}

export { Variable };
