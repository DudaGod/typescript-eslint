import * as tseslint from '@typescript-eslint/parser';
import { analyze } from '../../src/analyze';

function parse(
  code: string,
  sourceType?: tseslint.ParserOptions['sourceType'],
): ReturnType<typeof tseslint.parse> {
  sourceType = sourceType ?? 'module';

  return tseslint.parse(code, {
    range: true,
    sourceType,
  });
}

function parseAndAnalyze(
  code: string,
  sourceType?: tseslint.ParserOptions['sourceType'],
): {
  ast: ReturnType<typeof tseslint.parse>;
  scopeManager: ReturnType<typeof analyze>;
} {
  const ast = parse(code, sourceType);
  const scopeManager = analyze(ast);
  return { ast, scopeManager };
}

export { parse, parseAndAnalyze };
