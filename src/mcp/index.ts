import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AtlasForge } from "../core/facade.js";
import { z } from "zod";

/**
 * Atlas Forge MCP Server
 * Enables AI Agents to interact with the project memory layer natively.
 */
class AtlasForgeMcpServer {
    private server: Server;
    private forge: AtlasForge | null = null;
    private rootDir: string;

    constructor() {
        this.rootDir = process.cwd();
        this.server = new Server(
            {
                name: "atlas-forge",
                version: "0.2.2",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
    }

    private async ensureForge() {
        if (!this.forge) {
            this.forge = await AtlasForge.load(this.rootDir);
        }
        return this.forge;
    }

    private setupHandlers() {
        // 1. List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "af_init",
                        description: "Initialize Atlas Forge in the current directory",
                        inputSchema: {
                            type: "object",
                            properties: {},
                        },
                    },
                    {
                        name: "af_start_task",
                        description: "Starts a new task session with a summary",
                        inputSchema: {
                            type: "object",
                            properties: {
                                summary: { type: "string", description: "Short summary of the task objectives" },
                            },
                            required: ["summary"],
                        },
                    },
                    {
                        name: "af_add_memory",
                        description: "Capture a new memory entry (decision, module, task-note, code-pattern)",
                        inputSchema: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "Descriptive title of the memory" },
                                summary: { type: "string", description: "Brief summary of the knowledge" },
                                type: { 
                                    type: "string", 
                                    enum: ["decision", "module", "task-note", "code-pattern"],
                                    description: "The category of this memory" 
                                },
                                what_changed: { type: "string", description: "Detailed technical description of the change" },
                                why_it_matters: { type: "string", description: "Rationale and impact of this decision" },
                            },
                            required: ["title", "summary", "type"],
                        },
                    },
                    {
                        name: "af_search",
                        description: "Search project knowledge base for relevant context",
                        inputSchema: {
                            type: "object",
                            properties: {
                                query: { type: "string", description: "Search query or keywords" },
                                limit: { type: "number", description: "Maximum number of results to return", default: 5 },
                            },
                            required: ["query"],
                        },
                    },
                    {
                        name: "af_close_task",
                        description: "Close the active task session and promote staged memories to canonical store",
                        inputSchema: {
                            type: "object",
                            properties: {
                                summary: { type: "string", description: "Final summary of what was accomplished in this task" },
                            },
                            required: ["summary"],
                        },
                    },
                    {
                        name: "af_status",
                        description: "Get the current engine status and memory counts",
                        inputSchema: {
                            type: "object",
                            properties: {},
                        },
                    },
                ],
            };
        });

        // 2. Call tool
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case "af_init": {
                        const forge = await AtlasForge.init(this.rootDir);
                        this.forge = forge;
                        return { content: [{ type: "text", text: "Atlas Forge initialized successfully." }] };
                    }

                    case "af_start_task": {
                        const forge = await this.ensureForge();
                        const result = await forge.taskStart({ summary: args?.summary as string });
                        return { content: [{ type: "text", text: `Task session started: ${result.session.session_id}` }] };
                    }

                    case "af_add_memory": {
                        const forge = await this.ensureForge();
                        const schema = z.object({
                            title: z.string(),
                            summary: z.string(),
                            type: z.enum(["decision", "module", "task-note", "code-pattern"]),
                            what_changed: z.string().optional(),
                            why_it_matters: z.string().optional(),
                        });
                        const parsed = schema.parse(args);
                        await forge.add({
                            title: parsed.title,
                            summary: parsed.summary,
                            memory_type: parsed.type as any,
                            what_changed: parsed.what_changed || "N/A",
                            why_it_matters: parsed.why_it_matters || "N/A",
                        });
                        return { content: [{ type: "text", text: "Memory captured to staging." }] };
                    }

                    case "af_search": {
                        const forge = await this.ensureForge();
                        const results = await forge.search({
                            query: args?.query as string,
                            limit: (args?.limit as number) || 5,
                        });
                        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
                    }

                    case "af_close_task": {
                        const forge = await this.ensureForge();
                        const result = await forge.taskClose({ summary: args?.summary as string });
                        return { content: [{ type: "text", text: `Task closed. Promoted ${result.promoted_entries.length} entries.` }] };
                    }

                    case "af_status": {
                        const forge = await this.ensureForge();
                        const status = await forge.status();
                        return { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] };
                    }

                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error: ${error.message}` }],
                    isError: true,
                };
            }
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Atlas Forge MCP server running on stdio");
    }
}

const server = new AtlasForgeMcpServer();
server.run().catch(console.error);
