import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY)
const GEMINI_API_URL = String(process.env.GEMINI_API_URL)

export async function POST(request: NextRequest) {
  try {
    const { content, contentType } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const classificationPrompt = `You are a content classifier. Analyze the following content and return ONLY a valid JSON object with these exact fields:

{
  "category": "one of: personal, work, ideas, links, code, shopping, health, finance, travel, other",
  "title": "3-6 word title",
  "summary": "1-2 sentence summary",
  "tags": ["tag1", "tag2", "tag3"],
  "cleanedContent": "cleaned and formatted content",
  "priority": "low, medium, or high"
}

Rules:
- Choose the most appropriate category from the list
- For job/career content, use "work"
- For personal thoughts/notes, use "personal" 
- For project ideas, use "ideas"
- For URLs, use "links"
- For programming content, use "code"
- Return ONLY the JSON, no other text

Content to classify:
${content}`

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GEMINI_API_KEY ? { "X-goog-api-key": GEMINI_API_KEY } : {}),
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: classificationPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Lower temperature for more consistent results
          maxOutputTokens: 500,
        },
      }),
    })

    if (!response.ok) {
      console.error("Gemini API error:", response.status)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiResponse) {
      throw new Error("No response from Gemini AI")
    }

    console.log("[Debug] Raw AI response:", aiResponse)

    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse
      
      const classification = JSON.parse(jsonString)
      
      console.log("[Debug] Parsed classification:", classification)

      // Validate category
      const validCategories = ["personal", "work", "ideas", "links", "code", "shopping", "health", "finance", "travel", "other"]
      const category = validCategories.includes(classification.category) 
        ? classification.category 
        : "other"

      return NextResponse.json({
        success: true,
        classification: {
          category: category,
          title: classification.title || "Untitled Note",
          summary: classification.summary || content.substring(0, 100) + "...",
          tags: Array.isArray(classification.tags) ? classification.tags : [],
          cleanedContent: classification.cleanedContent || content,
          priority: ["low", "medium", "high"].includes(classification.priority) 
            ? classification.priority 
            : "medium",
        },
      })
    } catch (parseError) {
      console.error("[Debug] JSON parsing failed:", parseError)
      console.error("[Debug] Raw response was:", aiResponse)
      
      // Smart fallback based on content analysis
      let category = "other"
      const contentLower = content.toLowerCase()
      
      if (contentLower.includes("job") || contentLower.includes("work") || contentLower.includes("career") || contentLower.includes("freelance") || contentLower.includes("developer")) {
        category = "work"
      } else if (contentLower.includes("http") || contentLower.includes("www") || contentLower.includes(".com")) {
        category = "links"
      } else if (contentLower.includes("code") || contentLower.includes("function") || contentLower.includes("javascript") || contentLower.includes("react")) {
        category = "code"
      }

      return NextResponse.json({
        success: true,
        classification: {
          category: category,
          title: "Untitled Note",
          summary: content.substring(0, 100) + "...",
          tags: [],
          cleanedContent: content,
          priority: "medium",
        },
      })
    }
  } catch (error) {
    console.error("AI Classification error:", error)
    return NextResponse.json({ error: "Failed to classify content" }, { status: 500 })
  }
}