import { showError } from "./toast";

const HF_ACCESS_TOKEN = import.meta.env.VITE_HF_ACCESS_TOKEN;
const API_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL_NAME = "zai-org/GLM-4.5:novita";

export async function rewriteJobDescription(jobDescription: string): Promise<string> {
  if (!HF_ACCESS_TOKEN) {
    showError("Hugging Face access token is not set. Please set VITE_HF_ACCESS_TOKEN in your .env file.");
    throw new Error("Hugging Face access token is missing.");
  }

  const promptContent = `Rewrite this job description to create an ATS optimized resume job history entry. The entry must have the role name, dates of employment (or placeholder dates), and bullet point list that showcase quantifiable results from the role that align with the job description.

Job Description:
${jobDescription}

Rewritten Job Description:`;

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

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Hugging Face API error:", errorData);
      throw new Error(errorData.error || "Failed to fetch rewritten text from AI.");
    }

    const result = await response.json();
    if (result && result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
      return result.choices[0].message.content.trim();
    } else {
      throw new Error("Invalid response from AI model.");
    }
  } catch (error) {
    console.error("Error rewriting job description:", error);
    throw error;
  }
}