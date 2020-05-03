import * as tseslint from '@typescript-eslint/parser';
import { analyze, AnalyzeOptions } from '../../src/analyze';

type SourceType = AnalyzeOptions['sourceType'];

function parse(
  code: string,
  sourceType?: SourceType,
): ReturnType<typeof tseslint.parse> {
  return tseslint.parse(code, {
    range: true,
    sourceType,
  });
}

function parseAndAnalyze(
  code: string,
  option: SourceType | AnalyzeOptions = {},
): {
  ast: ReturnType<typeof tseslint.parse>;
  scopeManager: ReturnType<typeof analyze>;
} {
  const sourceType = typeof option === 'string' ? option : option.sourceType;
  option = typeof option === 'string' ? { sourceType } : option;
  const ast = parse(code, sourceType);
  const scopeManager = analyze(ast, option);
  return { ast, scopeManager };
}

export { parse, parseAndAnalyze };
