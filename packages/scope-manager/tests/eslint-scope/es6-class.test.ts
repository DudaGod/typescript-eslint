import { AST_NODE_TYPES } from '@typescript-eslint/experimental-utils';
import {
  expectToBeClassScope,
  expectToBeFunctionScope,
  expectToBeGlobalScope,
} from '../util/expect';
import { parse } from '../util/parse';
import { analyze } from '../../src/analyze';

describe('ES6 class', () => {
  it('declaration name creates class scope', () => {
    const ast = parse(`
            class Derived extends Base {
                constructor() {
                }
            }
            new Derived();
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(3);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('Derived');
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('Base');
    expect(scope.references[1].identifier.name).toBe('Derived');

    scope = scopeManager.scopes[1];
    expectToBeClassScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.ClassDeclaration);
    expect(scope.isStrict).toBeTruthy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('Derived');
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[2];
    expectToBeFunctionScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.FunctionExpression);
    expect(scope.isStrict).toBeTruthy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(0);
  });

  it('expression name creates class scope#1', () => {
    const ast = parse(`
            (class Derived extends Base {
                constructor() {
                }
            });
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(3);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('Base');

    scope = scopeManager.scopes[1];
    expectToBeClassScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.ClassExpression);
    expect(scope.isStrict).toBeTruthy();
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('Derived');
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[2];
    expectToBeFunctionScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.FunctionExpression);
  });

  it('expression name creates class scope#2', () => {
    const ast = parse(`
            (class extends Base {
                constructor() {
                }
            });
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(3);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('Base');

    scope = scopeManager.scopes[1];
    expectToBeClassScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.ClassExpression);

    scope = scopeManager.scopes[2];
    expectToBeFunctionScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.FunctionExpression);
  });

  it('computed property key may refer variables', () => {
    const ast = parse(`
            (function () {
                var yuyushiki = 42;
                (class {
                    [yuyushiki]() {
                    }

                    [yuyushiki + 40]() {
                    }
                });
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(5);

    let scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.FunctionExpression);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(2);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('yuyushiki');
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('yuyushiki');

    scope = scopeManager.scopes[2];
    expectToBeClassScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.ClassExpression);
    expect(scope.isStrict).toBeTruthy();
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('yuyushiki');
    expect(scope.references[1].identifier.name).toBe('yuyushiki');
  });

  it('regression #49', () => {
    const ast = parse(`
            class Shoe {
                constructor() {
                    //Shoe.x = true;
                }
            }
            let shoe = new Shoe();
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(3);

    const scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.block.type).toBe(AST_NODE_TYPES.Program);
    expect(scope.isStrict).toBeFalsy();
    expect(scope.variables).toHaveLength(2);
    expect(scope.variables[0].name).toBe('Shoe');
    expect(scope.variables[1].name).toBe('shoe');
    expect(scope.references).toHaveLength(2);
    expect(scope.references[0].identifier.name).toBe('shoe');
    expect(scope.references[1].identifier.name).toBe('Shoe');
  });
});
