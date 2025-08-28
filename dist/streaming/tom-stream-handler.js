// Main stream handler for ToM conversations
export class ToMStreamHandler {
    callbacks;
    constructor(callbacks) {
        this.callbacks = callbacks;
    }
    async consume(agent, message, context) {
        try {
            // Step 1: Get ToM analysis first and update UI immediately
            const currentSnapshot = await agent.getCurrentSnapshot();
            const tomUpdates = await agent.analyzeMessage(message, context);
            const newSnapshot = await agent.getUpdatedSnapshot();
            // Update ToM UI immediately after analysis
            for (const update of tomUpdates) {
                this.callbacks.updateMentalState({
                    type: update.type,
                    status: 'complete'
                });
            }
            // Show confidence and reasoning from analysis
            this.callbacks.showConfidence(0.8);
            this.callbacks.showReasoning('Mental state analysis complete');
            // Step 2: Generate conversational response (happens after UI updates)
            const conversationResponse = await agent.generateResponse(message, newSnapshot, tomUpdates, context);
            // Simulate streaming for the response to maintain UI compatibility
            const chunkSize = 3; // Characters per chunk
            // Stream the response in chunks
            for (let i = 0; i < conversationResponse.length; i += chunkSize) {
                const chunk = conversationResponse.slice(i, i + chunkSize);
                this.callbacks.streamResponse(chunk);
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 20));
            }
            // Notify completion
            this.callbacks.onComplete({
                response: conversationResponse,
                tomUpdates: tomUpdates,
                reasoning: 'Two-step analysis complete',
                confidence: 0.8
            });
        }
        catch (error) {
            console.error('Stream consumption failed:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=tom-stream-handler.js.map