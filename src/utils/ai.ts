import { showError } from "./toast";

const HF_ACCESS_TOKEN = import.meta.env.VITE_HF_ACCESS_TOKEN;
const MODEL_NAME = "deepseek-ai/DeepSeek-R1";

export async function rewriteJobDescription(jobDescription: string): Promise<string> {
  if (!HF_ACCESS_TOKEN) {
    showError("Hugging Face access token is not set. Please set VITE_HF_ACCESS_TOKEN in your .env file.");
    throw new Error("Hugging Face access token is missing.");
  }

  const prompt = `Rewrite this job description to create an ATS optimized resume job history entry. The entry must have the role name, dates of employment (or placeholder dates), and bullet point list that showcase quantifiable results from the role that align with the job description.

Job Description:
${jobDescription}

Rewritten Job Description:`;

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${HF_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: prompt,
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
    // Assuming the response structure is an array with a 'generated_text' field
    if (result && result.length > 0 && result[0].generated_text) {
      // Extract only the rewritten part, removing the prompt
      const generatedText = result[0].generated_text;
      const rewrittenPart = generatedText.replace(prompt, '').trim();
      return rewrittenPart;
    } else {
      throw new Error("Invalid response from AI model.");
    }
  } catch (error) {
    console.error("Error rewriting job description:", error);
    throw error;
  }
}