import { showError } from "./toast";

const GIBSON_AI_API_KEY = import.meta.env.VITE_GIBSON_AI_API_KEY;
const GIBSON_AI_BASE_URL = "https://api.gibsonai.com/v1/-";

interface GibsonAiError {
  detail: string | { code: number; entity?: string; field?: string; message: string }[];
}

async function callGibsonAiApi<T>(
  endpoint: string,
  method: string,
  body?: object,
): Promise<T> {
  if (!GIBSON_AI_API_KEY) {
    showError("GibsonAI API key is not set. Please set VITE_GIBSON_AI_API_KEY in your .env file.");
    throw new Error("GibsonAI API key is missing.");
  }

  const headers: HeadersInit = {
    "X-Gibson-API-Key": GIBSON_AI_API_KEY,
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(`${GIBSON_AI_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData: GibsonAiError = await response.json();
      let errorMessage = "An unknown error occurred with GibsonAI API.";

      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        errorMessage = errorData.detail.map(err => err.message).join(", ");
      }
      
      console.error(`GibsonAI API error (${response.status}):`, errorData);
      throw new Error(`GibsonAI API Error: ${errorMessage}`);
    }

    // For 204 No Content responses (like DELETE), return undefined
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  } catch (error) {
    console.error("Error calling GibsonAI API:", error);
    throw error;
  }
}

// --- Resume Endpoints ---
interface ResumeIn {
  summary: string;
  title: string;
  user_profile_id: number;
}

interface ResumeOut {
  id: number;
  uuid: string;
  summary: string;
  title: string;
  user_profile_id: number;
  date_created: string;
  date_updated: string | null;
}

export async function createResume(data: ResumeIn): Promise<ResumeOut> {
  return callGibsonAiApi<ResumeOut>("/resume", "POST", data);
}

// --- Job Description Endpoints ---
interface JobDescriptionIn {
  company_name: string;
  description: string;
  title: string;
  location?: string;
}

interface JobDescriptionOut {
  id: number;
  uuid: string;
  company_name: string;
  description: string;
  title: string;
  location: string | null;
  date_created: string;
  date_updated: string | null;
}

export async function createJobDescription(data: JobDescriptionIn): Promise<JobDescriptionOut> {
  return callGibsonAiApi<JobDescriptionOut>("/job-description", "POST", data);
}

// --- Analysis Report Endpoints ---
interface AnalysisReportIn {
  analyzed_by: number;
  job_description_id: number;
  resume_id: number;
}

interface AnalysisReportOut {
  id: number;
  uuid: string;
  analyzed_by: number;
  job_description_id: number;
  resume_id: number;
  date_created: string;
  date_updated: string | null;
}

export async function createAnalysisReport(data: AnalysisReportIn): Promise<AnalysisReportOut> {
  return callGibsonAiApi<AnalysisReportOut>("/analysis-report", "POST", data);
}

// --- Analysis Summary Endpoints ---
interface AnalysisSummaryIn {
  report_id: number;
  summary_text: string;
}

interface AnalysisSummaryOut {
  id: number;
  uuid: string;
  report_id: number;
  summary_text: string;
  date_created: string;
  date_updated: string | null;
}

export async function createAnalysisSummary(data: AnalysisSummaryIn): Promise<AnalysisSummaryOut> {
  return callGibsonAiApi<AnalysisSummaryOut>("/analysis-summary", "POST", data);
}

// --- Analysis Score Endpoints ---
interface AnalysisScoreIn {
  report_id: number;
  score: number;
  section: string;
}

interface AnalysisScoreOut {
  id: number;
  uuid: string;
  report_id: number;
  score: number;
  section: string;
  date_created: string;
  date_updated: string | null;
}

export async function createAnalysisScore(data: AnalysisScoreIn): Promise<AnalysisScoreOut> {
  return callGibsonAiApi<AnalysisScoreOut>("/analysis-score", "POST", data);
}