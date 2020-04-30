import { parse } from './util/parse';
import { analyze } from '../../src/analyze';
import { expectToBeGlobalScope } from './util/expect';

describe('global increment', () => {
  it('becomes read/write', () => {
    const ast = parse('b++;');

    const scopeManager = analyze(ast);

    expect(scopeManager.scopes).toHaveLength(1);

    const scope = scopeManager.scopes[0];
    expectToBeGlobalScope(scope);
    expect(scope.variables).toHaveLength(0);
    expect(scope.references).toHaveLength(1);
    expect(scope.references[0].isReadWrite()).toBeTruthy();
  });
});
