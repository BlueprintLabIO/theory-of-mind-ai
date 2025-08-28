import type { ToMSnapshot, ToMUpdate, BaseState } from '../types/index.js';

export class TemporalMemory {
  private snapshots: ToMSnapshot[] = [];
  private updates: ToMUpdate[] = [];
  private decayRate: number;
  private maxHistoryLength: number;
  private confidenceThreshold: number;
  private messageCount: number = 0;

  constructor(
    decayRate: number = 0.95,
    maxHistoryLength: number = 100,
    confidenceThreshold: number = 0.3
  ) {
    this.decayRate = decayRate;
    this.maxHistoryLength = maxHistoryLength;
    this.confidenceThreshold = confidenceThreshold;
  }

  addSnapshot(snapshot: ToMSnapshot): void {
    this.snapshots.push(snapshot);
    this.messageCount++;
    this.applyMessageBasedDecay();
    this.pruneHistory();
  }

  addUpdate(update: ToMUpdate): void {
    this.updates.push(update);
    this.pruneHistory();
  }

  getCurrentSnapshot(): ToMSnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  getSnapshotHistory(): ToMSnapshot[] {
    return [...this.snapshots];
  }

  getUpdateHistory(): ToMUpdate[] {
    return [...this.updates];
  }

  getSnapshotsSince(timestamp: number): ToMSnapshot[] {
    return this.snapshots.filter(snapshot => snapshot.timestamp >= timestamp);
  }

  getUpdatesSince(timestamp: number): ToMUpdate[] {
    return this.updates.filter(update => update.timestamp >= timestamp);
  }

  private applyMessageBasedDecay(): void {
    const currentSnapshot = this.getCurrentSnapshot();
    if (!currentSnapshot || this.snapshots.length < 2) return;

    const now = Date.now();
    let hasUpdates = false;

    // Apply decay based on message distance for all states except the most recent
    const decayedSnapshot: ToMSnapshot = {
      ...currentSnapshot,
      timestamp: now,
      epistemicStates: currentSnapshot.epistemicStates.map(state => {
        const messagesSinceCreation = this.messageCount - this.getMessageCountForState(state);
        const newConfidence = state.confidence * Math.pow(this.decayRate, messagesSinceCreation);
        
        if (Math.abs(newConfidence - state.confidence) > 0.01) {
          hasUpdates = true;
          this.addUpdate({
            timestamp: now,
            type: 'epistemic',
            action: 'confidence_decay',
            state: { ...state, confidence: newConfidence },
            previous_state: state,
            confidence_delta: newConfidence - state.confidence,
            reasoning: `Confidence decay after ${messagesSinceCreation} messages`
          });
        }
        
        return { ...state, confidence: newConfidence };
      }).filter(state => state.confidence >= this.confidenceThreshold),

      motivationalStates: currentSnapshot.motivationalStates.map(state => {
        const messagesSinceCreation = this.messageCount - this.getMessageCountForState(state);
        const newConfidence = state.confidence * Math.pow(this.decayRate, messagesSinceCreation);
        
        if (Math.abs(newConfidence - state.confidence) > 0.01) {
          hasUpdates = true;
          this.addUpdate({
            timestamp: now,
            type: 'motivational',
            action: 'confidence_decay',
            state: { ...state, confidence: newConfidence },
            previous_state: state,
            confidence_delta: newConfidence - state.confidence,
            reasoning: `Confidence decay after ${messagesSinceCreation} messages`
          });
        }
        
        return { ...state, confidence: newConfidence };
      }).filter(state => state.confidence >= this.confidenceThreshold),

      emotionalStates: currentSnapshot.emotionalStates.map(state => {
        const messagesSinceCreation = this.messageCount - this.getMessageCountForState(state);
        const newConfidence = state.confidence * Math.pow(this.decayRate, messagesSinceCreation);
        
        if (Math.abs(newConfidence - state.confidence) > 0.01) {
          hasUpdates = true;
          this.addUpdate({
            timestamp: now,
            type: 'emotional',
            action: 'confidence_decay',
            state: { ...state, confidence: newConfidence },
            previous_state: state,
            confidence_delta: newConfidence - state.confidence,
            reasoning: `Confidence decay after ${messagesSinceCreation} messages`
          });
        }
        
        return { ...state, confidence: newConfidence };
      }).filter(state => state.confidence >= this.confidenceThreshold),

      attentionalStates: currentSnapshot.attentionalStates.map(state => {
        const messagesSinceCreation = this.messageCount - this.getMessageCountForState(state);
        const newConfidence = state.confidence * Math.pow(this.decayRate, messagesSinceCreation);
        
        if (Math.abs(newConfidence - state.confidence) > 0.01) {
          hasUpdates = true;
          this.addUpdate({
            timestamp: now,
            type: 'attentional',
            action: 'confidence_decay',
            state: { ...state, confidence: newConfidence },
            previous_state: state,
            confidence_delta: newConfidence - state.confidence,
            reasoning: `Confidence decay after ${messagesSinceCreation} messages`
          });
        }
        
        return { ...state, confidence: newConfidence };
      }).filter(state => state.confidence >= this.confidenceThreshold),

      socialAwareness: (() => {
        const state = currentSnapshot.socialAwareness;
        const messagesSinceCreation = this.messageCount - this.getMessageCountForState(state);
        const newConfidence = state.confidence * Math.pow(this.decayRate, messagesSinceCreation);
        
        if (Math.abs(newConfidence - state.confidence) > 0.01) {
          hasUpdates = true;
          this.addUpdate({
            timestamp: now,
            type: 'social',
            action: 'confidence_decay',
            state: { ...state, confidence: newConfidence },
            previous_state: state,
            confidence_delta: newConfidence - state.confidence,
            reasoning: `Confidence decay after ${messagesSinceCreation} messages`
          });
        }
        
        return { ...state, confidence: newConfidence };
      })()
    };

    // Only update the current snapshot if there were actual changes
    if (hasUpdates) {
      this.snapshots[this.snapshots.length - 1] = decayedSnapshot;
    }
  }

  private getMessageCountForState(state: BaseState): number {
    // Find when this state was created by looking through snapshot history
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      const snapshot = this.snapshots[i];
      const hasState = [
        ...snapshot.epistemicStates,
        ...snapshot.motivationalStates,
        ...snapshot.emotionalStates,
        ...snapshot.attentionalStates,
        snapshot.socialAwareness
      ].some(s => s.id === state.id);
      
      if (hasState) {
        return i;
      }
    }
    return 0; // Default to beginning if not found
  }

  private pruneHistory(): void {
    // Prune snapshots
    if (this.snapshots.length > this.maxHistoryLength) {
      this.snapshots = this.snapshots.slice(-this.maxHistoryLength);
    }

    // Prune updates
    if (this.updates.length > this.maxHistoryLength * 2) {
      this.updates = this.updates.slice(-this.maxHistoryLength * 2);
    }
  }

  updateStateConfidence(stateId: string, newConfidence: number): boolean {
    const currentSnapshot = this.getCurrentSnapshot();
    if (!currentSnapshot) return false;

    // Find and update the state across all state arrays
    let updated = false;
    const now = Date.now();

    const updateInArray = <T extends BaseState>(states: T[], type: ToMUpdate['type']): T[] => {
      return states.map(state => {
        if (state.id === stateId) {
          updated = true;
          this.addUpdate({
            timestamp: now,
            type,
            action: 'update',
            state: { ...state, confidence: newConfidence },
            previous_state: state,
            reasoning: 'Manual confidence adjustment',
            confidence_delta: newConfidence - state.confidence
          });
          return { ...state, confidence: newConfidence, timestamp: now };
        }
        return state;
      });
    };

    const updatedSnapshot: ToMSnapshot = {
      ...currentSnapshot,
      timestamp: now,
      epistemicStates: updateInArray(currentSnapshot.epistemicStates, 'epistemic'),
      motivationalStates: updateInArray(currentSnapshot.motivationalStates, 'motivational'),
      emotionalStates: updateInArray(currentSnapshot.emotionalStates, 'emotional'),
      attentionalStates: updateInArray(currentSnapshot.attentionalStates, 'attentional'),
      socialAwareness: currentSnapshot.socialAwareness.id === stateId ? 
        (() => {
          updated = true;
          const newState = { ...currentSnapshot.socialAwareness, confidence: newConfidence, timestamp: now };
          this.addUpdate({
            timestamp: now,
            type: 'social',
            action: 'update',
            state: newState,
            previous_state: currentSnapshot.socialAwareness,
            reasoning: 'Manual confidence adjustment',
            confidence_delta: newConfidence - currentSnapshot.socialAwareness.confidence
          });
          return newState;
        })() : currentSnapshot.socialAwareness
    };

    if (updated) {
      this.addSnapshot(updatedSnapshot);
    }

    return updated;
  }

  destroy(): void {
    // Clean up resources if needed
    this.snapshots = [];
    this.updates = [];
  }
}