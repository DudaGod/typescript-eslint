import { createSerializer } from './baseSerializer';
import { Variable } from '../../src/Variable';

const serializer = createSerializer(Variable, [
  'defs',
  'identifiers',
  'name',
  'references',
]);

export { serializer };
