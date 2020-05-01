import { TSESTree } from '@typescript-eslint/experimental-utils';
import { DefinitionType } from './DefinitionType';

abstract class DefinitionBase<
  TType extends DefinitionType,
  TNode extends TSESTree.Node,
  TParent extends TSESTree.Node | null
> {
  /**
   * The type of the definition
   * @public
   */
  public readonly type: TType;

  /**
   * The `Identifier` node of this definition
   * @public
   */
  public readonly name: TSESTree.BindingName;

  /**
   * The enclosing node of the name.
   * @public
   */
  public readonly node: TNode;

  /**
   * the enclosing statement node of the identifier.
   * @public
   */
  public readonly parent: TParent;

  constructor(
    type: TType,
    name: TSESTree.BindingName,
    node: TNode,
    parent: TParent,
  ) {
    this.type = type;
    this.name = name;
    this.node = node;
    this.parent = parent;
  }
}

export { DefinitionBase };
