// hooks/useDynamicText.ts

import { useState, useCallback } from 'react';
import { generatePlantDescription } from '../services/ai/gemini';

/**
 * A hook to generate dynamic text content using the Gemini API.
 * Manages loading and error states.
 * 
 * @param generatorFn The AI function to call for text generation.
 * @returns An object containing the generated text, loading state, error, and a function to trigger generation.
 */
export const useDynamicText = (
    generatorFn: (...args: any[]) => Promise<string>
) => {
    const [text, setText] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const generateText = useCallback(async (...args: any[]) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generatorFn(...args);
            setText(result);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(errorMessage);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [generatorFn]);

    return { text, isLoading, error, generateText };
};


/**
 * Example Usage: A hook specifically for generating plant descriptions.
 */
export const usePlantDescriptionGenerator = () => {
    const { text, isLoading, error, generateText } = useDynamicText(generatePlantDescription);

    const generate = useCallback((plantName: string, theme: string) => {
        generateText(plantName, theme);
    }, [generateText]);

    return {
        description: text,
        isGenerating: isLoading,
        generationError: error,
        generateDescription: generate,
    };
};
