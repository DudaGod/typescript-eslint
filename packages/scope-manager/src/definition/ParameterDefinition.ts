import { TSESTree } from '@typescript-eslint/experimental-utils';
import { VariableType } from '../VariableType';
import { Definition } from './Definition';

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

export { ParameterDefinition };
