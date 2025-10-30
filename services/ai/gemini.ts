// services/ai/gemini.ts

import { GoogleGenAI } from "@google/genai";

// Gracefully handle the case where process.env is not defined in the browser to prevent a startup crash.
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

if (!apiKey) {
    console.error("API_KEY environment variable is not set. Gemini API features will be disabled.");
}

// Only initialize the AI client if the API key is available.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generates a creative description for a new plant based on its name and properties.
 * This is an example of how the Gemini API could be integrated.
 * @param plantName The name of the plant.
 * @param theme A theme for the description (e.g., 'mystical', 'cosmic').
 * @returns A promise that resolves to the generated description string.
 */
export const generatePlantDescription = async (plantName: string, theme: string): Promise<string> => {
    // If the AI client wasn't initialized, return a fallback description.
    if (!ai) {
        return "A plant with an aura of untapped potential.";
    }

    try {
        const prompt = `Generate a short, creative, and mystical description for a plant in an idle game. The plant's name is "${plantName}" and its theme is "${theme}". The description should be one sentence long and fit into a game's UI.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text;
        
        if (text) {
            // Basic cleanup
            return text.trim().replace(/^"|"$/g, '');
        } else {
            return "A mysterious plant of unknown origin.";
        }
    } catch (error) {
        console.error("Error generating plant description with Gemini API:", error);
        // Fallback description
        return "A plant with an aura of untapped potential.";
    }
};
