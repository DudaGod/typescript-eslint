import { TSESTree } from '@typescript-eslint/experimental-utils';
import { VariableType } from './VariableType';

/**
 * @class Definition
 */
class Definition {
  /**
   * type of the occurrence
   */
  public readonly type: VariableType;

  /**
   * the identifier AST node of the occurrence.
   */
  public readonly name: TSESTree.BindingName;

  /**
   * the enclosing node of the identifier.
   */
  public readonly node: TSESTree.Node;

  /**
   * the enclosing statement node of the identifier.
   */
  public readonly parent: TSESTree.Node | null | undefined;

  /**
   * the index in the declaration statement.
   */
  public readonly index: number | null | undefined;

  /**
   * the kind of the declaration statement.
   */
  public readonly kind: string | null | undefined;

  constructor(
    type: VariableType,
    name: TSESTree.BindingName,
    node: TSESTree.Node,
    parent?: TSESTree.Node | null,
    index?: number | null,
    kind?: string | null,
  ) {
    this.type = type;
    this.name = name;
    this.node = node;
    this.parent = parent;
    this.index = index;
    this.kind = kind;
  }
}

/**
 * @class ParameterDefinition
 */
class ParameterDefinition extends Definition {
  declare type: VariableType.Parameter;

  /**
   * Whether the parameter definition is a part of a rest parameter.
   * @member {boolean} ParameterDefinition#rest
   */
  public readonly rest: boolean;

  constructor(
    name: TSESTree.BindingName,
    node: TSESTree.Node,
    index: number,
    rest: boolean,
  ) {
    super(VariableType.Parameter, name, node, null, index, null);

    this.rest = rest;
  }
}

export { ParameterDefinition, Definition };
