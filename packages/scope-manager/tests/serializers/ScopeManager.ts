import { createSerializer } from './baseSerializer';
import { ScopeManager } from '../../src/ScopeManager';

const serializer = createSerializer(ScopeManager, ['scopes']);

export { serializer };
