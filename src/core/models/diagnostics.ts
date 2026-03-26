export interface DoctorCheck {
    name: string;
    entry_id: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
}

export interface DoctorResult {
    passed: boolean;
    can_promote: boolean;
    checks: DoctorCheck[];
    stats: { pass: number; warn: number; fail: number };
}

export interface DoctorOptions {
    entry_ids?: string[];
}
