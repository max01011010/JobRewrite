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

export interface AnalysisResult {
  summary: string;
  overallScore: number;
  categoryScores: {
    content: number;
    format: number;
    optimization: number;
    bestPractices: number;
    applicationReady: number;
  };
  recommendations: {
    content: string[]; // Changed to string array
    format: string[]; // Changed to string array
    optimization: string[]; // Changed to string array
    bestPractices: string[]; // Changed to string array
    applicationReady: string[]; // Changed to string array
  };
}

// Helper function to split a string into sentences
const splitIntoSentences = (text: string): string[] => {
  if (!text) return [];
  // Split by period, exclamation mark, or question mark, followed by a space or end of string
  // This regex handles cases like "Dr. Smith. This is a test."
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim() !== '').map(s => {
    let trimmed = s.trim();
    // Ensure each sentence ends with punctuation if it was split by it
    if (!/[.!?]$/.test(trimmed)) {
      return trimmed + '.'; // Add a period if missing
    }
    return trimmed;
  });
};

export async function analyzeResumeWithErnie(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  if (!HF_ACCESS_TOKEN) {
    showError("Hugging Face access token is not set. Please set VITE_HF_ACCESS_TOKEN in your .env file.");
    throw new Error("Hugging Face access token is missing.");
  }

  const promptContent = `Analyze the following resume against the provided job description.
  
  Resume:
  ${resumeText}
  
  Job Description:
  ${jobDescription}
  
  Based on the following categories and their considerations, provide a short, concise summary (max 3-4 sentences) of how well the resume matches the job description, highlighting key strengths and weaknesses. Then, provide an overall ATS compatibility score as a percentage (0-100), and a score for each of the five major categories (Content, Format, Optimization, Best Practices, Application Ready) as a percentage (0-100).
  
  For each of the five major categories, also provide a concise recommendation as a list of bullet points (1-2 sentences per bullet point) on how to improve the score in that specific category.
  
  Categories and Considerations:
  
  Content: Includes all individual sections and overall quality. Focus on clarity, meaning, avoiding generic buzzwords or weak verbs.
  - Short bullet points: Ensure enough detail to communicate significance, skills, and accomplishments. Not too short, not too long.
  - Punctuated bullet points: Proper punctuation for clarity, readability, and professionalism.
  - Quantified bullet points: Include numerical data for credibility and impact.
  - Incorrect number of bullet points: Aim for 3-10 bullet points total across the resume, and 3-6 per experience.
  - Weak bullet points: Just like tasteless tofu - they lack flavor, fail to highlight achievements or skills, use dull language, and lack results or examples, leaving employers unimpressed and hungry for more information.
  - Buzzwords: Trendy terms or phrases in resumes can make job seekers sound generic and unoriginal, failing to effectively highlight their unique skills and qualifications.‍
  - Personal pronouns: Leave personal pronouns (I, my, mine, etc) out of your resume. Keep the spotlight on your skills and accomplishments to show what you bring to the table without any distractions.‍
  - Passive voice: Using passive voice in your resume can make it harder for employers to identify your specific contributions and responsibilities. Always use an active voice for an engaging touch.‍
  - Filler words: Forget filler words (just, very, really, etc). Using these can dilute the impact of your statements, leaving you sounding less confident and less professional.
  
  Format: Focus on visual presentation and ATS compatibility.
  - Resume template: Use ATS-friendly designs.
  - Page length: 1-page is best; 2-pages only for Director/Executive roles.
  - Font size: Recommended 8.5-9.5pts.
  - Bullet points: These can be too many or too few! We always suggest keeping them in a range of 3 - 6 per experience.
  
  Optimization: Tailoring for specific roles and industries.
  - AI Keyword Targeting: Add a job title and description of the role you’re interested in to tailor your resume with targeted keywords (perfect for ATS applications).‍
  - Experience: Tailor your resume to match your experience level: Intern, Entry, Associate, Junior, Mid-Senior, Director, or Executive.‍
  - Industry: Speak the language of your industry and optimize your resume to match the needs and expectations of that field.
  
  Best Practices: General professional standards.
  - Locations: Add a geographical location to your work, involvement, and education experiences to give employers valuable insight into your adaptability and validate your experience.
  - Email: Your email address is the key to connecting with future employers and landing an interview - share it!
  - Date format: List dates in a written month format (January 2023) to quickly grasp your timeline of experience and enhance readability.
  - Resume name: Keep it simple and professional with your full name and "resume" so employers can easily recognize and remember your application, avoiding any confusion or awkward ‘MyResume’ moments.
  - Word count: Stay bite-sized with your resume by keeping your total word count in the range of 400-600 words.
  - LinkedIn URL: Give a backstage pass to your professional life with your LinkedIn URL to show beyond what's listed on your resume (in/fullname).
  - Skills format: Just like organizing your toolkit, make it easier for employers to quickly identify your strengths and expertise by separating your skills into categories: hard, soft, language, front-end, and more.
  
  Application Ready: Overall readiness for the application process, encompassing all other categories.
  
  Your output must strictly follow this JSON format:
  {
    "summary": "Your concise summary here.",
    "overallScore": [Overall ATS compatibility score as a number, e.g., 85],
    "categoryScores": {
      "content": [Content score as a number, e.g., 90],
      "format": [Format score as a number, e.g., 80],
      "optimization": [Optimization score as a number, e.g., 95],
      "bestPractices": [Best Practices score as a number, e.g., 75],
      "applicationReady": [Application Ready score as a number, e.g., 88]
    },
    "recommendations": {
      "content": ["Recommendation bullet 1.", "Recommendation bullet 2."],
      "format": ["Recommendation bullet 1.", "Recommendation bullet 2."],
      "optimization": ["Recommendation bullet 1.", "Recommendation bullet 2."],
      "bestPractices": ["Recommendation bullet 1.", "Recommendation bullet 2."],
      "applicationReady": ["Recommendation bullet 1.", "Recommendation bullet 2."]
    }
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
          
          const recommendationsMap: AnalysisResult['recommendations'] = {
            content: [], format: [], optimization: [], bestPractices: [], applicationReady: []
          };

          for (const key of Object.keys(recommendationsMap) as Array<keyof AnalysisResult['recommendations']>) {
            const rawRec = parsedResult.recommendations?.[key];
            if (Array.isArray(rawRec)) {
              recommendationsMap[key] = rawRec.map(s => s.trim());
            } else if (typeof rawRec === 'string') {
              recommendationsMap[key] = splitIntoSentences(rawRec);
            }
          }

          if (
            typeof parsedResult.summary === 'string' &&
            typeof parsedResult.overallScore === 'number' &&
            typeof parsedResult.categoryScores === 'object' &&
            typeof parsedResult.categoryScores.content === 'number' &&
            typeof parsedResult.categoryScores.format === 'number' &&
            typeof parsedResult.categoryScores.optimization === 'number' &&
            typeof parsedResult.categoryScores.bestPractices === 'number' &&
            typeof parsedResult.categoryScores.applicationReady === 'number'
          ) {
            return {
              summary: parsedResult.summary,
              overallScore: Math.max(0, Math.min(100, Math.round(parsedResult.overallScore))),
              categoryScores: {
                content: Math.max(0, Math.min(100, Math.round(parsedResult.categoryScores.content))),
                format: Math.max(0, Math.min(100, Math.round(parsedResult.categoryScores.format))),
                optimization: Math.max(0, Math.min(100, Math.round(parsedResult.categoryScores.optimization))),
                bestPractices: Math.max(0, Math.min(100, Math.round(parsedResult.categoryScores.bestPractices))),
                applicationReady: Math.max(0, Math.min(100, Math.round(parsedResult.categoryScores.applicationReady))),
              },
              recommendations: recommendationsMap,
            };
          } else {
            throw new Error("Parsed JSON does not contain expected 'summary', 'overallScore', 'categoryScores', and 'recommendations' fields with correct types.");
          }
        } catch (jsonError) {
          console.warn("AI response was not valid JSON, attempting fallback parsing:", rawContent);
          // Fallback parsing if AI doesn't return perfect JSON (less robust for nested objects)
          const summaryMatch = rawContent.match(/"summary":\s*"(.*?)"/s);
          const overallScoreMatch = rawContent.match(/"overallScore":\s*(\d+)/);
          const contentScoreMatch = rawContent.match(/"content":\s*(\d+)/);
          const formatScoreMatch = rawContent.match(/"format":\s*(\d+)/);
          const optimizationScoreMatch = rawContent.match(/"optimization":\s*(\d+)/);
          const bestPracticesScoreMatch = rawContent.match(/"bestPractices":\s*(\d+)/);
          const applicationReadyScoreMatch = rawContent.match(/"applicationReady":\s*(\d+)/);

          // Fallback for recommendations - try to extract as single strings and then split
          const contentRecMatch = rawContent.match(/"content":\s*"(.*?)"/s);
          const formatRecMatch = rawContent.match(/"format":\s*"(.*?)"/s);
          const optimizationRecMatch = rawContent.match(/"optimization":\s*"(.*?)"/s);
          const bestPracticesRecMatch = rawContent.match(/"bestPractices":\s*"(.*?)"/s);
          const applicationReadyRecMatch = rawContent.match(/"applicationReady":\s*"(.*?)"/s);


          const summary = summaryMatch ? summaryMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "Could not extract summary.";
          const overallScore = overallScoreMatch ? Math.max(0, Math.min(100, parseInt(overallScoreMatch[1], 10))) : 0;
          const categoryScores = {
            content: contentScoreMatch ? Math.max(0, Math.min(100, parseInt(contentScoreMatch[1], 10))) : 0,
            format: formatScoreMatch ? Math.max(0, Math.min(100, parseInt(formatScoreMatch[1], 10))) : 0,
            optimization: optimizationScoreMatch ? Math.max(0, Math.min(100, parseInt(optimizationScoreMatch[1], 10))) : 0,
            bestPractices: bestPracticesScoreMatch ? Math.max(0, Math.min(100, parseInt(bestPracticesScoreMatch[1], 10))) : 0,
            applicationReady: applicationReadyScoreMatch ? Math.max(0, Math.min(100, parseInt(applicationReadyScoreMatch[1], 10))) : 0,
          };
          const recommendations = {
            content: splitIntoSentences(contentRecMatch ? contentRecMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "No recommendation."),
            format: splitIntoSentences(formatRecMatch ? formatRecMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "No recommendation."),
            optimization: splitIntoSentences(optimizationRecMatch ? optimizationRecMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "No recommendation."),
            bestPractices: splitIntoSentences(bestPracticesRecMatch ? bestPracticesRecMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "No recommendation."),
            applicationReady: splitIntoSentences(applicationReadyRecMatch ? applicationReadyRecMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "No recommendation."),
          };


          if (summaryMatch && overallScoreMatch) {
            return { summary, overallScore, categoryScores, recommendations };
          } else {
            throw new Error("Failed to parse AI response for summary and scores.");
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