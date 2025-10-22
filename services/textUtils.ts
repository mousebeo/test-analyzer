interface ChunkingOptions {
    chunkSize: number;
    chunkOverlap: number;
}

/**
 * Splits a long text into smaller, potentially overlapping chunks.
 * This implementation splits by sentences and then joins them
 * up to the desired chunk size. It includes robust handling for
 * sentences that are themselves longer than the chunk size.
 * @param text The input text to split.
 * @param options Configuration for chunking.
 * @returns An array of text chunks.
 */
export function chunkText(text: string, options: ChunkingOptions): string[] {
    const { chunkSize, chunkOverlap } = options;

    if (!text) return [];

    // Split by sentences, but keep the delimiters.
    const sentences = text.split(/(?<=[.?!])\s+/g);
    
    // Fallback for text with no sentence breaks (like a long log line)
    if (sentences.length === 1 && sentences[0].length > chunkSize) {
        const longText = sentences[0];
        const chunks: string[] = [];
        for (let i = 0; i < longText.length; i += (chunkSize - chunkOverlap)) {
            chunks.push(longText.substring(i, i + chunkSize));
        }
        return chunks;
    }
    
    const chunks: string[] = [];
    let currentChunk = "";

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];

        // FIX: If a single sentence is larger than the chunk size, it must be split.
        if (sentence.length > chunkSize) {
            // First, push whatever we have in currentChunk.
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            // Then, split the oversized sentence itself with overlap.
            for (let j = 0; j < sentence.length; j += (chunkSize - chunkOverlap)) {
                chunks.push(sentence.substring(j, j + chunkSize));
            }
            // Reset currentChunk and continue to the next sentence.
            currentChunk = "";
            continue;
        }

        // If adding the new sentence exceeds the chunk size, finalize the current chunk
        if (currentChunk.length + sentence.length + (currentChunk.length > 0 ? 1 : 0) > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);

            // Start the next chunk with an overlap from previous sentences
            let overlapText = "";
            let overlapLength = 0;
            for (let j = i - 1; j >= 0; j--) {
                const prevSentence = sentences[j];
                const sentenceWithSpace = prevSentence + " ";
                if (overlapLength + sentenceWithSpace.length > chunkOverlap) break;
                overlapText = sentenceWithSpace + overlapText;
                overlapLength += sentenceWithSpace.length;
            }
            // The next chunk starts with the overlap, and the current sentence will be added after this block.
            currentChunk = overlapText.trim();
        }

        // Add the current sentence to the current chunk
        currentChunk += (currentChunk.length > 0 ? " " : "") + sentence;
    }

    // Add the last remaining chunk
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks.filter(c => c.trim().length > 0);
}