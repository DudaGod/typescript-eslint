import { createSerializer } from './baseSerializer';
import { DefinitionBase } from '../../src/definition/DefinitionBase';

const serializer = createSerializer(DefinitionBase, ['name', 'node']);

export { serializer };
