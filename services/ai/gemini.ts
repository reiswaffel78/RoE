// services/ai/gemini.ts
import { GoogleGenAI } from "@google/genai";
import { getFlag } from '../../utils/flags';
import { recordBootWarning } from '../../utils/bootDiagnostics';

const aiDisabled = getFlag('noAI');

const createClient = (): GoogleGenAI | null => {
    if (aiDisabled) {
        recordBootWarning('AI flavour disabled via flag');
        return null;
    }
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        recordBootWarning('AI flavour disabled (missing API key)');
        return null;
    }
    try {
        return new GoogleGenAI({ apiKey });
    } catch (error) {
        recordBootWarning('AI client failed to initialise');
        console.error('Failed to create Gemini client', error);
        return null;
    }
};

const ai = createClient();

/**
 * Generates a mystical, short description for a plant.
 * @param plantName The name of the plant.
 * @param theme A theme to guide the generation (e.g., 'ethereal', 'ancient').
 * @returns A promise that resolves to the generated description string.
 */
export async function generatePlantDescription(plantName: string, theme: string): Promise<string> {
        if (!ai) {
        return `The ${plantName} awaits a story.`;
    }
    const prompt = `Generate a short, mystical description for a fantasy plant named "${plantName}". The theme is "${theme}". Keep it under 25 words.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
                recordBootWarning('AI description generation failed');
        console.error("Error generating plant description:", error);
        return `The ${plantName} remains indescribable.`;
    }
}

/**
 * Generates a message from the perspective of a garden spirit.
 * @param gameStateSummary A string summarizing the current state of the garden.
 * @returns A promise that resolves to the spirit's message.
 */
export async function generateSpiritMessage(gameStateSummary: string): Promise<string> {
    if (!ai) {
        return 'The spirits rest in silence.';
    }
    const prompt = `The current state of the garden is: ${gameStateSummary}.
    Provide a short, cryptic, or encouraging message to the gardener. Keep it to one or two sentences.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a wise and ancient garden spirit. Your responses are short, mystical, and sometimes cryptic.",
            }
        });
        return response.text.trim();
    } catch (error) {
                recordBootWarning('AI spirit message failed');
        console.error("Error generating spirit message:", error);
        return 'The spirits are silent for now.';
    }
}
