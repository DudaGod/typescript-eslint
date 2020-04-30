import { parse } from './util/parse';
import { analyze } from '../../src/analyze';
import {
  expectToBeForScope,
  expectToBeFunctionScope,
  expectToBeGlobalScope,
  expectToBeIdentifier,
  expectToBeParameterDefinitionWithRest,
} from './util/expect';

describe('ES6 destructuring assignments', () => {
  it('Pattern in var in ForInStatement', () => {
    const ast = parse(`
            (function () {
                for (var [a, b, c] in array);
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(4);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('a');
    expect(scope.variables[2].name).toBe('b');
    expect(scope.variables[3].name).toBe('c');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('a');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBe(scope.variables[1]);
    expect(scope.references[1].identifier.name).toBe('b');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBe(scope.variables[2]);
    expect(scope.references[2].identifier.name).toBe('c');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expect(scope.references[2].partial).toBeTruthy();
    expect(scope.references[2].resolved).toBe(scope.variables[3]);
    expect(scope.references[3].identifier.name).toBe('array');
    expect(scope.references[3].isWrite()).toBeFalsy();
  });

  it('Pattern in let in ForInStatement', () => {
    const ast = parse(`
            (function () {
                for (let [a, b, c] in array);
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(3); // [global, function, for]

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('array');

    scope = scopeManager.scopes[2];
    expectToBeForScope(scope);
    expect(scope.variables).toHaveLength(3);
    expect(scope.variables[0].name).toBe('a');
    expect(scope.variables[1].name).toBe('b');
    expect(scope.variables[2].name).toBe('c');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('a');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBe(scope.variables[0]);
    expect(scope.references[1].identifier.name).toBe('b');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBe(scope.variables[1]);
    expect(scope.references[2].identifier.name).toBe('c');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expect(scope.references[2].partial).toBeTruthy();
    expect(scope.references[2].resolved).toBe(scope.variables[2]);
    expect(scope.references[3].identifier.name).toBe('array');
    expect(scope.references[3].isWrite()).toBeFalsy();
    expect(scope.references[3].resolved).toBeNull();
  });

  it('Pattern with default values in var in ForInStatement', () => {
    const ast = parse(`
            (function () {
                for (var [a, b, c = d] in array);
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(2);
    expect(scope['implicit'].left[0].identifier.name).toBe('d');
    expect(scope['implicit'].left[1].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(4);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('a');
    expect(scope.variables[2].name).toBe('b');
    expect(scope.variables[3].name).toBe('c');
    expect(scope.references).toHaveLength(6);
    expect(scope.references[0].identifier.name).toBe('c');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[0].writeExpr);
    expect(scope.references[0].writeExpr.name).toBe('d');
    expect(scope.references[0].partial).toBeFalsy();
    expect(scope.references[0].resolved).toBe(scope.variables[3]);
    expect(scope.references[1].identifier.name).toBe('d');
    expect(scope.references[1].isWrite()).toBeFalsy();
    expect(scope.references[2].identifier.name).toBe('a');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expect(scope.references[2].partial).toBeTruthy();
    expect(scope.references[2].resolved).toBe(scope.variables[1]);
    expect(scope.references[3].identifier.name).toBe('b');
    expect(scope.references[3].isWrite()).toBeTruthy();
    expect(scope.references[3].partial).toBeTruthy();
    expect(scope.references[3].resolved).toBe(scope.variables[2]);
    expect(scope.references[4].identifier.name).toBe('c');
    expect(scope.references[4].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[4].writeExpr);
    expect(scope.references[4].writeExpr.name).toBe('array');
    expect(scope.references[4].partial).toBeTruthy();
    expect(scope.references[4].resolved).toBe(scope.variables[3]);
    expect(scope.references[5].identifier.name).toBe('array');
    expect(scope.references[5].isWrite()).toBeFalsy();
  });

  it('Pattern with default values in let in ForInStatement', () => {
    const ast = parse(`
            (function () {
                for (let [a, b, c = d] in array);
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(3); // [global, function, for]

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(2);
    expect(scope['implicit'].left[0].identifier.name).toBe('d');
    expectToBeForScope(scope['implicit'].left[0].from);
    expect(scope['implicit'].left[1].identifier.name).toBe('array');
    expectToBeForScope(scope['implicit'].left[1].from);

    scope = scopeManager.scopes[2];
    expectToBeForScope(scope);
    expect(scope.variables).toHaveLength(3);
    expect(scope.variables[0].name).toBe('a');
    expect(scope.variables[1].name).toBe('b');
    expect(scope.variables[2].name).toBe('c');
    expect(scope.references).toHaveLength(6);
    expect(scope.references[0].identifier.name).toBe('c');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[0].writeExpr);
    expect(scope.references[0].writeExpr.name).toBe('d');
    expect(scope.references[0].partial).toBeFalsy();
    expect(scope.references[0].resolved).toBe(scope.variables[2]);
    expect(scope.references[1].identifier.name).toBe('d');
    expect(scope.references[1].isWrite()).toBeFalsy();
    expect(scope.references[2].identifier.name).toBe('a');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[2].writeExpr);
    expect(scope.references[2].writeExpr.name).toBe('array');
    expect(scope.references[2].partial).toBeTruthy();
    expect(scope.references[2].resolved).toBe(scope.variables[0]);
    expect(scope.references[3].identifier.name).toBe('b');
    expect(scope.references[3].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[3].writeExpr);
    expect(scope.references[3].writeExpr.name).toBe('array');
    expect(scope.references[3].partial).toBeTruthy();
    expect(scope.references[3].resolved).toBe(scope.variables[1]);
    expect(scope.references[4].identifier.name).toBe('c');
    expect(scope.references[4].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[4].writeExpr);
    expect(scope.references[4].writeExpr.name).toBe('array');
    expect(scope.references[4].partial).toBeTruthy();
    expect(scope.references[4].resolved).toBe(scope.variables[2]);
    expect(scope.references[5].identifier.name).toBe('array');
    expect(scope.references[5].isWrite()).toBeFalsy();
    expect(scope.references[5].resolved).toBeNull();
  });

  it('Pattern with nested default values in var in ForInStatement', () => {
    const ast = parse(`
            (function () {
                for (var [a, [b, c = d] = e] in array);
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(3);
    expect(scope['implicit'].left[0].identifier.name).toBe('d');
    expect(scope['implicit'].left[1].identifier.name).toBe('e');
    expect(scope['implicit'].left[2].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(4);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('a');
    expect(scope.variables[2].name).toBe('b');
    expect(scope.variables[3].name).toBe('c');
    expect(scope.references).toHaveLength(9);
    expect(scope.references[0].identifier.name).toBe('b');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[0].writeExpr);
    expect(scope.references[0].writeExpr.name).toBe('e');
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBe(scope.variables[2]);
    expect(scope.references[1].identifier.name).toBe('c');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[1].writeExpr);
    expect(scope.references[1].writeExpr.name).toBe('e');
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBe(scope.variables[3]);
    expect(scope.references[2].identifier.name).toBe('c');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[2].writeExpr);
    expect(scope.references[2].writeExpr.name).toBe('d');
    expect(scope.references[2].partial).toBeFalsy();
    expect(scope.references[2].resolved).toBe(scope.variables[3]);
    expect(scope.references[3].identifier.name).toBe('d');
    expect(scope.references[3].isWrite()).toBeFalsy();
    expect(scope.references[4].identifier.name).toBe('e');
    expect(scope.references[4].isWrite()).toBeFalsy();
    expect(scope.references[5].identifier.name).toBe('a');
    expect(scope.references[5].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[5].writeExpr);
    expect(scope.references[5].writeExpr.name).toBe('array');
    expect(scope.references[5].partial).toBeTruthy();
    expect(scope.references[5].resolved).toBe(scope.variables[1]);
    expect(scope.references[6].identifier.name).toBe('b');
    expect(scope.references[6].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[6].writeExpr);
    expect(scope.references[6].writeExpr.name).toBe('array');
    expect(scope.references[6].partial).toBeTruthy();
    expect(scope.references[6].resolved).toBe(scope.variables[2]);
    expect(scope.references[7].identifier.name).toBe('c');
    expect(scope.references[7].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[7].writeExpr);
    expect(scope.references[7].writeExpr.name).toBe('array');
    expect(scope.references[7].partial).toBeTruthy();
    expect(scope.references[7].resolved).toBe(scope.variables[3]);
    expect(scope.references[8].identifier.name).toBe('array');
    expect(scope.references[8].isWrite()).toBeFalsy();
  });

  it('Pattern with nested default values in let in ForInStatement', () => {
    const ast = parse(`
            (function () {
                for (let [a, [b, c = d] = e] in array);
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(3); // [global, function, for]

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(3);
    expect(scope['implicit'].left[0].identifier.name).toBe('d');
    expectToBeForScope(scope['implicit'].left[0].from);
    expect(scope['implicit'].left[1].identifier.name).toBe('e');
    expectToBeForScope(scope['implicit'].left[1].from);
    expect(scope['implicit'].left[2].identifier.name).toBe('array');
    expectToBeForScope(scope['implicit'].left[2].from);

    scope = scopeManager.scopes[2];
    expectToBeForScope(scope);
    expect(scope.variables).toHaveLength(3);
    expect(scope.variables[0].name).toBe('a');
    expect(scope.variables[1].name).toBe('b');
    expect(scope.variables[2].name).toBe('c');
    expect(scope.references).toHaveLength(9);
    expect(scope.references[0].identifier.name).toBe('b');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[0].writeExpr);
    expect(scope.references[0].writeExpr.name).toBe('e');
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBe(scope.variables[1]);
    expect(scope.references[1].identifier.name).toBe('c');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[1].writeExpr);
    expect(scope.references[1].writeExpr.name).toBe('e');
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBe(scope.variables[2]);
    expect(scope.references[2].identifier.name).toBe('c');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[2].writeExpr);
    expect(scope.references[2].writeExpr.name).toBe('d');
    expect(scope.references[2].partial).toBeFalsy();
    expect(scope.references[2].resolved).toBe(scope.variables[2]);
    expect(scope.references[3].identifier.name).toBe('d');
    expect(scope.references[3].isWrite()).toBeFalsy();
    expect(scope.references[4].identifier.name).toBe('e');
    expect(scope.references[4].isWrite()).toBeFalsy();
    expect(scope.references[5].identifier.name).toBe('a');
    expect(scope.references[5].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[5].writeExpr);
    expect(scope.references[5].writeExpr.name).toBe('array');
    expect(scope.references[5].partial).toBeTruthy();
    expect(scope.references[5].resolved).toBe(scope.variables[0]);
    expect(scope.references[6].identifier.name).toBe('b');
    expect(scope.references[6].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[6].writeExpr);
    expect(scope.references[6].writeExpr.name).toBe('array');
    expect(scope.references[6].partial).toBeTruthy();
    expect(scope.references[6].resolved).toBe(scope.variables[1]);
    expect(scope.references[7].identifier.name).toBe('c');
    expect(scope.references[7].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[7].writeExpr);
    expect(scope.references[7].writeExpr.name).toBe('array');
    expect(scope.references[7].partial).toBeTruthy();
    expect(scope.references[7].resolved).toBe(scope.variables[2]);
    expect(scope.references[8].identifier.name).toBe('array');
    expect(scope.references[8].isWrite()).toBeFalsy();
    expect(scope.references[8].resolved).toBeNull();
  });

  it('Pattern with default values in var in ForInStatement (separate declarations)', () => {
    const ast = parse(`
            (function () {
                var a, b, c;
                for ([a, b, c = d] in array);
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(2);
    expect(scope['implicit'].left[0].identifier.name).toBe('d');
    expect(scope['implicit'].left[1].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(4);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('a');
    expect(scope.variables[2].name).toBe('b');
    expect(scope.variables[3].name).toBe('c');
    expect(scope.references).toHaveLength(6);
    expect(scope.references[0].identifier.name).toBe('a');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBe(scope.variables[1]);
    expect(scope.references[1].identifier.name).toBe('b');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBe(scope.variables[2]);
    expect(scope.references[2].identifier.name).toBe('c');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[2].writeExpr);
    expect(scope.references[2].writeExpr.name).toBe('d');
    expect(scope.references[2].partial).toBeFalsy();
    expect(scope.references[2].resolved).toBe(scope.variables[3]);
    expect(scope.references[3].identifier.name).toBe('c');
    expect(scope.references[3].isWrite()).toBeTruthy();
    expectToBeIdentifier(scope.references[3].writeExpr);
    expect(scope.references[3].writeExpr.name).toBe('array');
    expect(scope.references[3].partial).toBeTruthy();
    expect(scope.references[3].resolved).toBe(scope.variables[3]);
    expect(scope.references[4].identifier.name).toBe('d');
    expect(scope.references[4].isWrite()).toBeFalsy();
    expect(scope.references[5].identifier.name).toBe('array');
    expect(scope.references[5].isWrite()).toBeFalsy();
  });

  it('Pattern with default values in var in ForInStatement (separate declarations and with MemberExpression)', () => {
    const ast = parse(`
            (function () {
                var obj;
                for ([obj.a, obj.b, obj.c = d] in array);
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(2);
    expect(scope['implicit'].left[0].identifier.name).toBe('d');
    expect(scope['implicit'].left[1].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(2);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('obj');
    expect(scope.references).toHaveLength(5);
    expect(scope.references[0].identifier.name).toBe('obj'); // obj.a
    expect(scope.references[0].isWrite()).toBeFalsy();
    expect(scope.references[0].isRead()).toBeTruthy();
    expect(scope.references[0].resolved).toBe(scope.variables[1]);
    expect(scope.references[1].identifier.name).toBe('obj'); // obj.b
    expect(scope.references[1].isWrite()).toBeFalsy();
    expect(scope.references[1].isRead()).toBeTruthy();
    expect(scope.references[1].resolved).toBe(scope.variables[1]);
    expect(scope.references[2].identifier.name).toBe('obj'); // obj.c
    expect(scope.references[2].isWrite()).toBeFalsy();
    expect(scope.references[2].isRead()).toBeTruthy();
    expect(scope.references[2].resolved).toBe(scope.variables[1]);
    expect(scope.references[3].identifier.name).toBe('d');
    expect(scope.references[3].isWrite()).toBeFalsy();
    expect(scope.references[3].isRead()).toBeTruthy();
    expect(scope.references[4].identifier.name).toBe('array');
    expect(scope.references[4].isWrite()).toBeFalsy();
    expect(scope.references[4].isRead()).toBeTruthy();
  });

  it('ArrayPattern in var', () => {
    const ast = parse(`
            (function () {
                var [a, b, c] = array;
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(4);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('a');
    expect(scope.variables[2].name).toBe('b');
    expect(scope.variables[3].name).toBe('c');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('a');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBe(scope.variables[1]);
    expect(scope.references[1].identifier.name).toBe('b');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBe(scope.variables[2]);
    expect(scope.references[2].identifier.name).toBe('c');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expect(scope.references[2].partial).toBeTruthy();
    expect(scope.references[2].resolved).toBe(scope.variables[3]);
    expect(scope.references[3].identifier.name).toBe('array');
    expect(scope.references[3].isWrite()).toBeFalsy();
  });

  it('SpreadElement in var', () => {
    let ast = parse(`
            (function () {
                var [a, b, ...rest] = array;
            }());
        `);

    let scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(4);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('a');
    expect(scope.variables[2].name).toBe('b');
    expect(scope.variables[3].name).toBe('rest');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('a');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBe(scope.variables[1]);
    expect(scope.references[1].identifier.name).toBe('b');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBe(scope.variables[2]);
    expect(scope.references[2].identifier.name).toBe('rest');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expect(scope.references[2].partial).toBeTruthy();
    expect(scope.references[2].resolved).toBe(scope.variables[3]);
    expect(scope.references[3].identifier.name).toBe('array');
    expect(scope.references[3].isWrite()).toBeFalsy();

    ast = parse(`
            (function () {
                var [a, b, ...[c, d, ...rest]] = array;
            }());
        `);

    scopeManager = analyze(ast, { ecmaVersion: 6 });
    expect(scopeManager.scopes).toHaveLength(2);

    scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);

    expect(scope.variables).toHaveLength(6);
    const expectedVariableNames = ['arguments', 'a', 'b', 'c', 'd', 'rest'];

    for (let index = 0; index < expectedVariableNames.length; index++) {
      expect(scope.variables[index].name).toBe(expectedVariableNames[index]);
    }

    expect(scope.references).toHaveLength(6);
    const expectedReferenceNames = ['a', 'b', 'c', 'd', 'rest'];

    for (let index = 0; index < expectedReferenceNames.length; index++) {
      expect(scope.references[index].identifier.name).toBe(
        expectedReferenceNames[index],
      );
      expect(scope.references[index].isWrite()).toBeTruthy();
      expect(scope.references[index].partial).toBeTruthy();
    }
    expect(scope.references[5].identifier.name).toBe('array');
    expect(scope.references[5].isWrite()).toBeFalsy();
  });

  it('ObjectPattern in var', () => {
    const ast = parse(`
            (function () {
                var {
                    shorthand,
                    key: value,
                    hello: {
                        world
                    }
                } = object;
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('object');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(4);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('shorthand');
    expect(scope.variables[2].name).toBe('value');
    expect(scope.variables[3].name).toBe('world');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('shorthand');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBe(scope.variables[1]);
    expect(scope.references[1].identifier.name).toBe('value');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBe(scope.variables[2]);
    expect(scope.references[2].identifier.name).toBe('world');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expect(scope.references[2].partial).toBeTruthy();
    expect(scope.references[2].resolved).toBe(scope.variables[3]);
    expect(scope.references[3].identifier.name).toBe('object');
    expect(scope.references[3].isWrite()).toBeFalsy();
  });

  it('complex pattern in var', () => {
    const ast = parse(`
            (function () {
                var {
                    shorthand,
                    key: [ a, b, c, d, e ],
                    hello: {
                        world
                    }
                } = object;
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('object');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(8);
    const expectedVariableNames = [
      'arguments',
      'shorthand',
      'a',
      'b',
      'c',
      'd',
      'e',
      'world',
    ];

    for (let index = 0; index < expectedVariableNames.length; index++) {
      expect(scope.variables[index].name).toBe(expectedVariableNames[index]);
    }
    expect(scope.references).toHaveLength(8);
    const expectedReferenceNames = [
      'shorthand',
      'a',
      'b',
      'c',
      'd',
      'e',
      'world',
    ];

    for (let index = 0; index < expectedReferenceNames.length; index++) {
      expect(scope.references[index].identifier.name).toBe(
        expectedReferenceNames[index],
      );
      expect(scope.references[index].isWrite()).toBeTruthy();
      expect(scope.references[index].partial).toBeTruthy();
    }
    expect(scope.references[7].identifier.name).toBe('object');
    expect(scope.references[7].isWrite()).toBeFalsy();
  });

  it('ArrayPattern in AssignmentExpression', () => {
    const ast = parse(`
            (function () {
                [a, b, c] = array;
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(4);
    expect(scope['implicit'].left.map(left => left.identifier.name)).toEqual([
      'a',
      'b',
      'c',
      'array',
    ]);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('a');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBeNull();
    expect(scope.references[1].identifier.name).toBe('b');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBeNull();
    expect(scope.references[2].identifier.name).toBe('c');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expect(scope.references[2].partial).toBeTruthy();
    expect(scope.references[2].resolved).toBeNull();
    expect(scope.references[3].identifier.name).toBe('array');
    expect(scope.references[3].isWrite()).toBeFalsy();
  });

  it('ArrayPattern with MemberExpression in AssignmentExpression', () => {
    const ast = parse(`
            (function () {
                var obj;
                [obj.a, obj.b, obj.c] = array;
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(2);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('obj');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('obj');
    expect(scope.references[0].isWrite()).toBeFalsy();
    expect(scope.references[0].isRead()).toBeTruthy();
    expect(scope.references[0].resolved).toBe(scope.variables[1]);
    expect(scope.references[1].identifier.name).toBe('obj');
    expect(scope.references[1].isWrite()).toBeFalsy();
    expect(scope.references[1].isRead()).toBeTruthy();
    expect(scope.references[1].resolved).toBe(scope.variables[1]);
    expect(scope.references[2].identifier.name).toBe('obj');
    expect(scope.references[2].isWrite()).toBeFalsy();
    expect(scope.references[2].isRead()).toBeTruthy();
    expect(scope.references[2].resolved).toBe(scope.variables[1]);
    expect(scope.references[3].identifier.name).toBe('array');
    expect(scope.references[3].isWrite()).toBeFalsy();
    expect(scope.references[3].isRead()).toBeTruthy();
  });

  it('SpreadElement in AssignmentExpression', () => {
    let ast = parse(`
            (function () {
                [a, b, ...rest] = array;
            }());
        `);

    let scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(4);
    expect(scope['implicit'].left.map(left => left.identifier.name)).toEqual([
      'a',
      'b',
      'rest',
      'array',
    ]);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('a');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBeNull();
    expect(scope.references[1].identifier.name).toBe('b');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBeNull();
    expect(scope.references[2].identifier.name).toBe('rest');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expect(scope.references[2].partial).toBeTruthy();
    expect(scope.references[2].resolved).toBeNull();
    expect(scope.references[3].identifier.name).toBe('array');
    expect(scope.references[3].isWrite()).toBeFalsy();

    ast = parse(`
            (function () {
                [a, b, ...[c, d, ...rest]] = array;
            }());
        `);

    scopeManager = analyze(ast, { ecmaVersion: 6 });
    expect(scopeManager.scopes).toHaveLength(2);

    scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(6);
    expect(scope['implicit'].left.map(left => left.identifier.name)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'rest',
      'array',
    ]);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);

    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');

    expect(scope.references).toHaveLength(6);
    const expectedReferenceNames = ['a', 'b', 'c', 'd', 'rest'];

    for (let index = 0; index < expectedReferenceNames.length; index++) {
      expect(scope.references[index].identifier.name).toBe(
        expectedReferenceNames[index],
      );
      expect(scope.references[index].isWrite()).toBeTruthy();
      expect(scope.references[index].partial).toBeTruthy();
      expect(scope.references[index].resolved).toBeNull();
    }
    expect(scope.references[5].identifier.name).toBe('array');
    expect(scope.references[5].isWrite()).toBeFalsy();
  });

  it('SpreadElement with MemberExpression in AssignmentExpression', () => {
    const ast = parse(`
            (function () {
                [a, b, ...obj.rest] = array;
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(4);
    expect(scope['implicit'].left.map(left => left.identifier.name)).toEqual([
      'a',
      'b',
      'obj',
      'array',
    ]);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('a');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBeNull();
    expect(scope.references[1].identifier.name).toBe('b');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBeNull();
    expect(scope.references[2].identifier.name).toBe('obj');
    expect(scope.references[2].isWrite()).toBeFalsy();
    expect(scope.references[3].identifier.name).toBe('array');
    expect(scope.references[3].isWrite()).toBeFalsy();
  });

  it('ObjectPattern in AssignmentExpression', () => {
    const ast = parse(`
            (function () {
                ({
                    shorthand,
                    key: value,
                    hello: {
                        world
                    }
                } = object);
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(4);
    expect(scope['implicit'].left.map(left => left.identifier.name)).toEqual([
      'shorthand',
      'value',
      'world',
      'object',
    ]);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(4);
    expect(scope.references[0].identifier.name).toBe('shorthand');
    expect(scope.references[0].isWrite()).toBeTruthy();
    expect(scope.references[0].partial).toBeTruthy();
    expect(scope.references[0].resolved).toBeNull();
    expect(scope.references[1].identifier.name).toBe('value');
    expect(scope.references[1].isWrite()).toBeTruthy();
    expect(scope.references[1].partial).toBeTruthy();
    expect(scope.references[1].resolved).toBeNull();
    expect(scope.references[2].identifier.name).toBe('world');
    expect(scope.references[2].isWrite()).toBeTruthy();
    expect(scope.references[2].partial).toBeTruthy();
    expect(scope.references[2].resolved).toBeNull();
    expect(scope.references[3].identifier.name).toBe('object');
    expect(scope.references[3].isWrite()).toBeFalsy();
  });

  it('complex pattern in AssignmentExpression', () => {
    const ast = parse(`
            (function () {
                ({
                    shorthand,
                    key: [ a, b, c, d, e ],
                    hello: {
                        world
                    }
                } = object);
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);
    expect(scope['implicit'].left).toHaveLength(8);
    expect(scope['implicit'].left.map(left => left.identifier.name)).toEqual([
      'shorthand',
      'a',
      'b',
      'c',
      'd',
      'e',
      'world',
      'object',
    ]);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(1);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.references).toHaveLength(8);
    const expectedReferenceNames = [
      'shorthand',
      'a',
      'b',
      'c',
      'd',
      'e',
      'world',
    ];

    for (let index = 0; index < expectedReferenceNames.length; index++) {
      expect(scope.references[index].identifier.name).toBe(
        expectedReferenceNames[index],
      );
      expect(scope.references[index].isWrite()).toBeTruthy();
      expect(scope.references[index].partial).toBeTruthy();
    }
    expect(scope.references[7].identifier.name).toBe('object');
    expect(scope.references[7].isWrite()).toBeFalsy();
  });

  it('ArrayPattern in parameters', () => {
    const ast = parse(`
            (function ([a, b, c]) {
            }(array));
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('array');
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(4);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('a');
    expect(scope.variables[2].name).toBe('b');
    expect(scope.variables[3].name).toBe('c');
    expect(scope.references).toHaveLength(0);
  });

  it('SpreadElement in parameters', () => {
    const ast = parse(`
            (function ([a, b, ...rest], ...rest2) {
            }(array));
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('array');
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('array');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(5);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('a');
    expect(scope.variables[2].name).toBe('b');
    expect(scope.variables[3].name).toBe('rest');
    expectToBeParameterDefinitionWithRest(scope.variables[3].defs[0]);
    expect(scope.variables[4].name).toBe('rest2');
    expectToBeParameterDefinitionWithRest(scope.variables[4].defs[0]);
    expect(scope.references).toHaveLength(0);
  });

  it('ObjectPattern in parameters', () => {
    const ast = parse(`
            (function ({
                    shorthand,
                    key: value,
                    hello: {
                        world
                    }
                }) {
            }(object));
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('object');
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('object');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(4);
    expect(scope.variables[0].name).toBe('arguments');
    expect(scope.variables[1].name).toBe('shorthand');
    expect(scope.variables[2].name).toBe('value');
    expect(scope.variables[3].name).toBe('world');
    expect(scope.references).toHaveLength(0);
  });

  it('complex pattern in parameters', () => {
    const ast = parse(`
            (function ({
                    shorthand,
                    key: [ a, b, c, d, e ],
                    hello: {
                        world
                    }
                }) {
            }(object));
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].identifier.name).toBe('object');
    expect(scope['implicit'].left).toHaveLength(1);
    expect(scope['implicit'].left[0].identifier.name).toBe('object');

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(8);
    const expectedVariableNames = [
      'arguments',
      'shorthand',
      'a',
      'b',
      'c',
      'd',
      'e',
      'world',
    ];

    for (let index = 0; index < expectedVariableNames.length; index++) {
      expect(scope.variables[index].name).toBe(expectedVariableNames[index]);
    }
    expect(scope.references).toHaveLength(0);
  });

  it('default values and patterns in var', () => {
    const ast = parse(`
            (function () {
                var [a, b, c, d = 20 ] = array;
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(5);
    const expectedVariableNames = ['arguments', 'a', 'b', 'c', 'd'];

    for (let index = 0; index < expectedVariableNames.length; index++) {
      expect(scope.variables[index].name).toBe(expectedVariableNames[index]);
    }
    expect(scope.references).toHaveLength(6);
    const expectedReferenceNames = [
      'a',
      'b',
      'c',
      'd', // assign 20
      'd', // assign array
      'array',
    ];

    for (let index = 0; index < expectedReferenceNames.length; index++) {
      expect(scope.references[index].identifier.name).toBe(
        expectedReferenceNames[index],
      );
    }
  });

  it('default values containing references and patterns in var', () => {
    const ast = parse(`
            (function () {
                var [a, b, c, d = e ] = array;
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(5);
    const expectedVariableNames = ['arguments', 'a', 'b', 'c', 'd'];

    for (let index = 0; index < expectedVariableNames.length; index++) {
      expect(scope.variables[index].name).toBe(expectedVariableNames[index]);
    }
    expect(scope.references).toHaveLength(7);
    const expectedReferenceNames = [
      'a', // assign array
      'b', // assign array
      'c', // assign array
      'd', // assign e
      'd', // assign array
      'e',
      'array',
    ];

    for (let index = 0; index < expectedReferenceNames.length; index++) {
      expect(scope.references[index].identifier.name).toBe(
        expectedReferenceNames[index],
      );
    }
  });

  it('nested default values containing references and patterns in var', () => {
    const ast = parse(`
            (function () {
                var [a, b, [c, d = e] = f ] = array;
            }());
        `);

    const scopeManager = analyze(ast, { ecmaVersion: 6 });

    expect(scopeManager.scopes).toHaveLength(2);

    let scope = scopeManager.scopes[0];

    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(0);

    scope = scopeManager.scopes[1];
    expectToBeFunctionScope(scope);
    expect(scope.variables).toHaveLength(5);
    const expectedVariableNames = ['arguments', 'a', 'b', 'c', 'd'];

    for (let index = 0; index < expectedVariableNames.length; index++) {
      expect(scope.variables[index].name).toBe(expectedVariableNames[index]);
    }
    expect(scope.references).toHaveLength(10);
    const expectedReferenceNames = [
      'a', // assign array
      'b', // assign array
      'c', // assign f
      'c', // assign array
      'd', // assign f
      'd', // assign e
      'd', // assign array
      'e',
      'f',
      'array',
    ];

    for (let index = 0; index < expectedReferenceNames.length; index++) {
      expect(scope.references[index].identifier.name).toBe(
        expectedReferenceNames[index],
      );
    }
  });
});
