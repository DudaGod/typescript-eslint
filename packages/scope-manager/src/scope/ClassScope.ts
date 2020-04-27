import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Scope } from '.';
import { ScopeBase } from './ScopeBase';
import { ScopeType } from './ScopeType';
import { ScopeManager } from '../ScopeManager';

class ClassScope extends ScopeBase {
  declare type: ScopeType.class;
  declare block: TSESTree.ClassDeclaration | TSESTree.ClassExpression;
  constructor(
    scopeManager: ScopeManager,
    upperScope: Scope | null,
    block: ClassScope['block'],
  ) {
    super(scopeManager, ScopeType.class, upperScope, block, false);
  }
}

export { ClassScope };
