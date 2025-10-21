interface ChunkingOptions {
    chunkSize: number;
    chunkOverlap: number;
}

/**
 * Splits a long text into smaller, potentially overlapping chunks.
 * This is a simple implementation that splits by sentences and then joins them
 * up to the desired chunk size.
 * @param text The input text to split.
 * @param options Configuration for chunking.
 * @returns An array of text chunks.
 */
export function chunkText(text: string, options: ChunkingOptions): string[] {
    const { chunkSize, chunkOverlap } = options;

    if (!text) return [];

    // A simple sentence splitter.
    // Handles basic cases but might not be perfect for all edge cases.
    const sentences = text.split(/(?<=[.?!])\s+/g);
    
    const chunks: string[] = [];
    let currentChunk = "";

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];

        // If adding the new sentence exceeds the chunk size, push the current chunk
        if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);

            // Start the next chunk with an overlap
            let overlapText = "";
            let overlapLength = 0;
            // Go backwards from the current position to build the overlap
            for (let j = i - 1; j >= 0; j--) {
                const prevSentence = sentences[j];
                if (overlapLength + prevSentence.length > chunkOverlap) break;
                overlapText = prevSentence + " " + overlapText;
                overlapLength += prevSentence.length;
            }
            currentChunk = overlapText.trim();
        }

        currentChunk += (currentChunk ? " " : "") + sentence;
    }

    // Add the last remaining chunk
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}
