export interface TaskSession {
    session_id: string;
    title: string;
    status: 'active' | 'closed';
    created_at: string;
    updated_at: string;
    related_memories_loaded: string[];
    handoff_path?: string;
    metadata: Record<string, any>;
}
