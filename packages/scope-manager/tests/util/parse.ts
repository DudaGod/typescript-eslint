import * as tseslint from '@typescript-eslint/parser';

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

export { parse };
