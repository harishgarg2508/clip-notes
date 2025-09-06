export interface AIClassification {
  category: string
  title: string
  summary: string
  tags: string[]
  cleanedContent: string
  priority: "low" | "medium" | "high"
}

export async function classifyContent(content: string, contentType: string): Promise<AIClassification | null> {
  try {
    const response = await fetch("/api/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, contentType }),
    })

    if (!response.ok) {
      throw new Error("Classification failed")
    }

    const data = await response.json()
    return data.success ? data.classification : null
  } catch (error) {
    console.error("AI Service error:", error)
    return null
  }
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    personal: "👤",
    work: "💼",
    ideas: "💡",
    links: "🔗",
    code: "💻",
    shopping: "🛒",
    health: "🏥",
    finance: "💰",
    travel: "✈️",
    other: "📝",
  }
  return icons[category] || icons.other
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-red-600",
  }
  return colors[priority] || colors.medium
}
