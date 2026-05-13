import { NextRequest, NextResponse } from "next/server";
import { openai, MODEL } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface Resource {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  order: number;
  searchQuery: string;
  resources?: Resource[];
}

async function searchTavily(query: string): Promise<Resource[]> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `${query} free tutorial learn`,
        search_depth: "basic",
        max_results: 4,
        include_answer: false,
      }),
    });
    const data = await res.json();
    return (data.results ?? []).map((r: TavilyResult) => ({
      title: r.title,
      url: r.url,
      snippet: (r.content ?? "").slice(0, 180),
      source: (() => {
        try { return new URL(r.url).hostname.replace("www.", ""); }
        catch { return r.url; }
      })(),
    }));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const { profile } = await req.json();

  // Step 1: GPT-4o designs the structured learning path
  const structurePrompt = `You are an expert learning advisor for AtomCamp, a Pakistan-based tech education platform.

A learner completed their diagnostic assessment. Design a personalized learning path.

LEARNER PROFILE:
- Background: ${profile.background}
- Goal: ${profile.goal}
- Daily time available: ${profile.timeAvailable}
- Programming level: ${profile.programmingLevel}
- Interest domain: ${profile.interest}

Design a learning path of 4-6 topics in logical progression. Each topic needs a specific web search query to find the best free resources for it.

Respond ONLY with raw JSON (no markdown, no code block):
{
  "topics": [
    {
      "id": "unique-kebab-slug",
      "title": "Topic Title",
      "description": "1-2 sentences on what they will learn and why it matters",
      "estimatedHours": 8,
      "order": 1,
      "searchQuery": "exact search query e.g. 'Python variables and data types beginner tutorial 2024'"
    }
  ],
  "personalizedMessage": "2-sentence warm motivating message addressing this learner's specific goal and background",
  "estimatedCompletion": "X months",
  "focusArea": "Primary skill domain they will master",
  "weeklyGoal": "Specific actionable weekly target e.g. '3 topics + 1 quiz per week'"
}`;

  let pathStructure: { topics: Topic[]; personalizedMessage: string; estimatedCompletion: string; focusArea: string; weeklyGoal: string };

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: structurePrompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    pathStructure = JSON.parse(completion.choices[0].message.content ?? "{}");
  } catch {
    // Fallback if OpenAI fails
    pathStructure = {
      topics: [
        { id: "programming-basics", title: "Programming Basics", description: "Core programming concepts and problem-solving skills.", estimatedHours: 6, order: 1, searchQuery: "programming basics for beginners free tutorial" },
        { id: "python-fundamentals", title: "Python Fundamentals", description: "Python syntax, data structures, and functions.", estimatedHours: 10, order: 2, searchQuery: "Python fundamentals complete course free 2024" },
        { id: "data-analysis", title: "Data Analysis with Pandas", description: "Analyze real datasets using Python and Pandas.", estimatedHours: 12, order: 3, searchQuery: "pandas data analysis tutorial free beginners" },
      ],
      personalizedMessage: "We've crafted a path tailored to your goals. Start with the fundamentals and build your way up — consistency beats intensity every time.",
      estimatedCompletion: "3 months",
      focusArea: "Data Science",
      weeklyGoal: "2 topics + 1 quiz per week",
    };
  }

  // Step 2: Tavily searches for real free resources for each topic — in parallel
  const topicsWithResources = await Promise.all(
    (pathStructure.topics ?? []).map(async (topic: Topic) => {
      const resources = await searchTavily(topic.searchQuery ?? topic.title);
      return { ...topic, resources };
    })
  );

  const enrichedPath = { ...pathStructure, topics: topicsWithResources };

  // Step 3: Save to Supabase for the logged-in user (best-effort)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("learning_paths").upsert(
        { user_id: user.id, learner_profile: profile, path_data: enrichedPath },
        { onConflict: "user_id" }
      );
    }
  } catch {}

  return NextResponse.json(enrichedPath);
}
