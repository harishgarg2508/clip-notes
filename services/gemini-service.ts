// services/geminiService.ts
import { AIClassification, Category } from "@/lib/types"

const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY)
const GEMINI_API_URL = String(process.env.GEMINI_API_URL)

/**
 * Formats the category hierarchy into a readable string for the AI prompt.
 * @param categories - A list of user's existing categories.
 * @returns A string representing the category tree.
 */
function formatCategoriesForPrompt(categories: Category[]): string {
  if (categories.length === 0) {
    return "No categories exist yet. You are free to create the first one."
  }
  // Sort by path to ensure parent categories come before children
  return categories
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(c => `- ${c.path}`)
    .join("\n")
}

/**
 * Classifies content using Gemini with dynamic category creation logic.
 * @param content - The raw content to classify.
 * @param existingCategories - The user's current categories to provide context.
 * @returns A structured AIClassification object.
 */
export async function classifyContent(
  content: string,
  existingCategories: Category[]
): Promise<AIClassification> {
  const categoryContext = formatCategoriesForPrompt(existingCategories)

  const classificationPrompt = `
You are an expert data architect and content analyst. Your task is to analyze the user's content and assign it to a precise hierarchical category.

You MUST return ONLY a valid JSON object with the following structure:
{
  "categoryPath": "string",
  "title": "string",
  "summary": "string",
  "tags": ["string"],
  "cleanedContent": "string",
  "priority": "string",
  "reasoning": "string"
}

**EXISTING CATEGORY STRUCTURE:**
${categoryContext}

**RULES FOR CATEGORIZATION:**
1.  **Analyze and Understand:** Deeply analyze the content to understand its core topic and sub-topic.
2.  **Path-Based System:** The "categoryPath" is a "/" separated string representing the hierarchy (e.g., "Work/Projects/Project-X", "Learning/Python", "Personal Finance").
3.  **Specificity is Key:** Always choose the most specific path possible. If the content is about AWS S3 and "Cloud/AWS" exists, the ideal path is "Cloud/AWS/S3".
4.  **Reuse and Extend:**
    * If a perfect path exists, USE IT.
    * If a parent path exists, CREATE A NEW SUB-CATEGORY. (e.g., content is about 'React Hooks', path 'Development/React' exists -> new path is 'Development/React/Hooks').
    * If no relevant path exists, CREATE A NEW TOP-LEVEL a path.
5.  **Hierarchy Depth:** Aim for a hierarchy of 1 to 3 levels deep. Avoid excessively deep nesting.
6.  **JSON ONLY:** Your entire response must be ONLY the JSON object, with no markdown, comments, or other text.

**CONTENT TO CLASSIFY:**
\`\`\`
${content}
\`\`\`
`

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: classificationPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json", // Critical for reliable JSON output
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Gemini API error response:", errorBody);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!aiResponseText) {
    throw new Error("No response text from Gemini AI");
  }

  try {
    const classification = JSON.parse(aiResponseText) as AIClassification;
    // Basic validation
    if (!classification.categoryPath || !classification.title) {
        throw new Error("AI response is missing required fields.");
    }
    return classification;
  } catch (e) {
    console.error("Failed to parse Gemini JSON response:", e);
    console.error("Raw response was:", aiResponseText);
    throw new Error("Invalid JSON response from AI.");
  }
}