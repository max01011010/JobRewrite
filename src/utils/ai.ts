import { showError } from "./toast";

const HF_ACCESS_TOKEN = import.meta.env.VITE_HF_ACCESS_TOKEN;
const API_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL_NAME = "baidu/ERNIE-4.5-VL-424B-A47B-Base-PT:novita";

export async function rewriteJobDescription(jobDescription: string): Promise<string> {
  if (!HF_ACCESS_TOKEN) {
    showError("Hugging Face access token is not set. Please set VITE_HF_ACCESS_TOKEN in your .env file.");
    throw new Error("Hugging Face access token is missing.");
  }

  const promptContent = `Rewrite the following job description into an ATS-optimized resume job history entry. Your output must *strictly* follow this format:
Role Title: [Role Name]
Dates of Employment: [Start Date] – [End Date] (e.g., 'Jan 2020 – Dec 2023')
- [Quantifiable bullet point 1]
- [Quantifiable bullet point 2]
- [Quantifiable bullet point 3]
...

Focus on quantifiable results relevant to the job description. Do not include any additional text, explanations, or conversational elements.

Job Description:
${jobDescription}

Rewritten Job Description:`;

  const MAX_RETRIES = 1; // One retry means two attempts in total
  const RETRY_DELAY_MS = 30000; // 30 seconds

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        API_URL,
        {
          headers: {
            Authorization: `Bearer ${HF_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
              {
                role: "user",
                content: promptContent,
              },
            ],
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              do_sample: true,
            },
          }),
        }
      );

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          console.warn(`Attempt ${attempt + 1}: Received 429 Too Many Requests. Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          continue; // Retry the request
        } else {
          // Last attempt failed with 429
          throw new Error("TooManyRequestsError"); // Custom error type to distinguish
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Hugging Face API error:", errorData);
        throw new Error(errorData.error || "Failed to fetch rewritten text from AI.");
      }

      const result = await response.json();
      if (result && result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
        let rawRewrittenText = result.choices[0].message.content.trim();

        // Remove the "Rewritten Job Description:" prefix if it exists
        const prefix = "Rewritten Job Description:";
        if (rawRewrittenText.startsWith(prefix)) {
          rawRewrittenText = rawRewrittenText.substring(prefix.length).trim();
        }

        // Remove any text enclosed in square brackets (e.g., [Role Name])
        rawRewrittenText = rawRewrittenText.replace(/\[.*?\]/g, '').trim();

        // Split into lines and filter to keep only the structured parts
        const lines = rawRewrittenText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let filteredLines: string[] = [];
        let foundRoleTitle = false;

        for (const line of lines) {
          if (line.startsWith("Role Title:")) {
            foundRoleTitle = true;
            filteredLines.push(line.replace("Role Title:", "").trim());
          } else if (foundRoleTitle && line.startsWith("Dates of Employment:")) {
            let datePart = line.replace("Dates of Employment:", "").trim();
            if (datePart === "") {
              filteredLines.push("[MM/DD/YYYY] - [MM/DD/YYYY]");
            } else {
              filteredLines.push(datePart);
            }
          } else if (foundRoleTitle && line.startsWith("-")) {
            filteredLines.push(line);
          } else if (foundRoleTitle) {
            // If we've found the role title and now encounter a line that's not
            // Dates of Employment or a bullet point, it's likely the end of the
            // desired section or unwanted text. Stop processing.
            break;
          }
        }

        return filteredLines.join('\n');
      } else {
        throw new Error("Invalid response from AI model.");
      }
    } catch (error) {
      // If it's a "TooManyRequestsError" from the last attempt, re-throw it
      if (error instanceof Error && error.message === "TooManyRequestsError") {
        throw error;
      }
      // For other errors, re-throw immediately without retrying
      console.error("Error during API call:", error);
      throw error;
    }
  }
  // This part should ideally not be reached if MAX_RETRIES is handled correctly
  throw new Error("Failed to rewrite job description after multiple attempts.");
}

interface AnalysisResult {
  summary: string;
  score: number;
}

export async function analyzeResumeWithErnie(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  if (!HF_ACCESS_TOKEN) {
    showError("Hugging Face access token is not set. Please set VITE_HF_ACCESS_TOKEN in your .env file.");
    throw new Error("Hugging Face access token is missing.");
  }

  const scoringWeights = `
  - Keyword matching: 30%
  - Skills alignment: 25%
  - Experience relevance: 20%
  - Education match: 15%
  - Format & structure: 10%
  `;

  const promptContent = `Analyze the following resume against the provided job description.
  
  Resume:
  ${resumeText}
  
  Job Description:
  ${jobDescription}
  
  Based on the following scoring weights, provide a short, concise summary (max 3-4 sentences) of how well the resume matches the job description, highlighting key strengths and weaknesses. Then, provide an overall ATS compatibility score as a percentage (0-100).
  
  Scoring Weights:
  ${scoringWeights}
  
  Your output must strictly follow this JSON format:
  {
    "summary": "Your concise summary here.",
    "score": [ATS compatibility score as a number, e.g., 85]
  }
  `;

  const MAX_RETRIES = 1;
  const RETRY_DELAY_MS = 30000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        API_URL,
        {
          headers: {
            Authorization: `Bearer ${HF_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
              {
                role: "user",
                content: promptContent,
              }
            ],
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              do_sample: true,
            },
          }),
        }
      );

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          console.warn(`Attempt ${attempt + 1}: Received 429 Too Many Requests. Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        } else {
          throw new Error("TooManyRequestsError");
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Hugging Face API error:", errorData);
        throw new Error(errorData.error || "Failed to fetch analysis from AI.");
      }

      const result = await response.json();
      if (result && result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
        const rawContent = result.choices[0].message.content.trim();
        
        // Attempt to parse JSON
        try {
          const parsedResult = JSON.parse(rawContent);
          if (typeof parsedResult.summary === 'string' && typeof parsedResult.score === 'number') {
            return {
              summary: parsedResult.summary,
              score: Math.max(0, Math.min(100, Math.round(parsedResult.score))), // Ensure score is between 0-100
            };
          } else {
            throw new Error("Parsed JSON does not contain expected 'summary' (string) and 'score' (number) fields.");
          }
        } catch (jsonError) {
          console.warn("AI response was not valid JSON, attempting fallback parsing:", rawContent);
          // Fallback parsing if AI doesn't return perfect JSON
          const summaryMatch = rawContent.match(/"summary":\s*"(.*?)"/s);
          const scoreMatch = rawContent.match(/"score":\s*(\d+)/);

          const summary = summaryMatch ? summaryMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "Could not extract summary.";
          const score = scoreMatch ? Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10))) : 0;

          if (summaryMatch && scoreMatch) {
            return { summary, score };
          } else {
            throw new Error("Failed to parse AI response for summary and score.");
          }
        }
      } else {
        throw new Error("Invalid response structure from AI model.");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "TooManyRequestsError") {
        throw error;
      }
      console.error("Error during AI analysis API call:", error);
      throw error;
    }
  }
  throw new Error("Failed to analyze resume after multiple attempts.");
}