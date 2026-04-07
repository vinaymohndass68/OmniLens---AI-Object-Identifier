
import { GoogleGenAI, Type } from "@google/genai";
import { IdentificationResult, ItemType } from "../types";

export async function identifyObjectsInImage(base64Image: string): Promise<IdentificationResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `Analyze this image and identify all significant objects, plants, animals, or items visible. 
  For each item found, provide:
  1. The common name.
  2. Whether it is 'living' or 'non-living'.
  3. A concise description.
  4. If it is 'living', provide its Genus and Species name.
  5. If it is 'non-living', provide its likely place of origin (where it was first invented, manufactured, or naturally found).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: [ItemType.LIVING, ItemType.NON_LIVING] },
                  description: { type: Type.STRING },
                  scientificName: {
                    type: Type.OBJECT,
                    properties: {
                      genus: { type: Type.STRING },
                      species: { type: Type.STRING }
                    },
                    required: ["genus", "species"]
                  },
                  origin: { type: Type.STRING }
                },
                required: ["name", "type", "description"]
              }
            }
          },
          required: ["items"]
        }
      }
    });

    const jsonStr = response.text || '{"items": []}';
    return JSON.parse(jsonStr) as IdentificationResult;
  } catch (error) {
    console.error("Error identifying objects:", error);
    throw new Error("Failed to identify objects in the image. Please try again.");
  }
}
