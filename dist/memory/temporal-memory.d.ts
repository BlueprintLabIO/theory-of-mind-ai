import type { ToMSnapshot, ToMUpdate } from '../types/index.js';
export declare class TemporalMemory {
    private snapshots;
    private updates;
    private decayRate;
    private maxHistoryLength;
    private confidenceThreshold;
    private messageCount;
    constructor(decayRate?: number, maxHistoryLength?: number, confidenceThreshold?: number);
    addSnapshot(snapshot: ToMSnapshot): void;
    addUpdate(update: ToMUpdate): void;
    getCurrentSnapshot(): ToMSnapshot | null;
    getSnapshotHistory(): ToMSnapshot[];
    getUpdateHistory(): ToMUpdate[];
    getSnapshotsSince(timestamp: number): ToMSnapshot[];
    getUpdatesSince(timestamp: number): ToMUpdate[];
    private applyMessageBasedDecay;
    private getMessageCountForState;
    private pruneHistory;
    updateStateConfidence(stateId: string, newConfidence: number): boolean;
    destroy(): void;
}
//# sourceMappingURL=temporal-memory.d.ts.map