import { TSESTree } from '@typescript-eslint/experimental-utils';
import { DefinitionType } from './DefinitionType';
import { DefinitionBase } from './DefinitionBase';

class ParameterDefinition extends DefinitionBase {
  declare type: DefinitionType.Parameter;

  /**
   * Whether the parameter definition is a part of a rest parameter.
   */
  public readonly rest: boolean;
  constructor(
    name: TSESTree.BindingName,
    node: TSESTree.Node,
    index: number,
    rest: boolean,
  ) {
    super(DefinitionType.Parameter, name, node, null, index, null);
    this.rest = rest;
  }
}

export { ParameterDefinition };
