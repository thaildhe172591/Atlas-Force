import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MEMORY_TYPES } from '../../src/core/models/states.js';
import { MemoryEntrySchema } from '../../src/core/schemas/entry-schema.js';
import { MCP_MEMORY_TYPES, getMcpTools } from '../../src/mcp/index.js';

describe('Contract Sync', () => {
    it('keeps core memory type enum aligned with schema and MCP tool schema', () => {
        const schemaEnum = MemoryEntrySchema.shape.memory_type.options;
        expect(schemaEnum).toEqual(MEMORY_TYPES);
        expect(MCP_MEMORY_TYPES).toEqual(MEMORY_TYPES);

        const addTool = getMcpTools().find((tool) => tool.name === 'af_add_memory');
        const enumValues = addTool?.inputSchema?.properties?.type?.enum;
        expect(enumValues).toEqual(MEMORY_TYPES);
    });

    it('keeps README command surface in sync with CLI public commands', () => {
        const readme = fs.readFileSync(path.resolve(process.cwd(), 'README.md'), 'utf-8');
        expect(readme).toContain('atlas-forge init');
        expect(readme).toContain('atlas-forge start');
        expect(readme).toContain('atlas-forge add');
        expect(readme).toContain('atlas-forge doctor');
        expect(readme).toContain('atlas-forge close');
        expect(readme).toContain('atlas-forge search');
        expect(readme).toContain('atlas-forge status');
        expect(readme).toContain('atlas-forge verify');
        expect(readme).toContain('atlas-forge optimize');
    });
});
