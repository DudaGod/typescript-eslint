import { createSerializer } from './baseSerializer';
import { ScopeBase } from '../../src/scope/ScopeBase';

const serializer = createSerializer(ScopeBase, [
  'block',
  'isStrict',
  'references',
  'set',
  'type',
  'variables',
]);

export { serializer };
