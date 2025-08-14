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
  queryParams?: Record<string, string | number | boolean>,
): Promise<T> {
  if (!GIBSON_AI_API_KEY) {
    showError("GibsonAI API key is not set. Please set VITE_GIBSON_AI_API_KEY in your .env file.");
    throw new Error("GibsonAI API key is missing.");
  }

  const headers: HeadersInit = {
    "X-Gibson-API-Key": GIBSON_AI_API_KEY,
    "Content-Type": "application/json",
  };

  let url = `${GIBSON_AI_BASE_URL}${endpoint}`;
  if (queryParams) {
    const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
    url = `${url}?${queryString}`;
  }

  const config: RequestInit = {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(url, config);

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

export interface ResumeOut {
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

export async function getResume(resumeId: number): Promise<ResumeOut> {
  return callGibsonAiApi<ResumeOut>(`/resume/${resumeId}`, "GET");
}

// --- Job Description Endpoints ---
interface JobDescriptionIn {
  company_name: string;
  description: string;
  title: string;
  location?: string;
  user_profile_id: number; // Add user_profile_id here
}

export interface JobDescriptionOut {
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

export async function getJobDescription(jobDescriptionId: number): Promise<JobDescriptionOut> {
  return callGibsonAiApi<JobDescriptionOut>(`/job-description/${jobDescriptionId}`, "GET");
}

// --- Analysis Report Endpoints ---
export type AnalysisReportStatus = 'not_applied' | 'applied' | 'interviewing' | 'offer' | 'rejected';

interface AnalysisReportIn {
  analyzed_by: number;
  job_description_id: number;
  resume_id: number;
  status?: AnalysisReportStatus; // Add status to creation
}

export interface AnalysisReportOut {
  id: number;
  uuid: string;
  analyzed_by: number;
  job_description_id: number;
  resume_id: number;
  status: AnalysisReportStatus; // Ensure status is always present
  date_created: string;
  date_updated: string | null;
}

interface AnalysisReportInUpdate {
  status: AnalysisReportStatus;
}

export async function createAnalysisReport(data: AnalysisReportIn): Promise<AnalysisReportOut> {
  return callGibsonAiApi<AnalysisReportOut>("/analysis-report", "POST", data);
}

export async function getAnalysisReports(userProfileId: number): Promise<AnalysisReportOut[]> {
  return callGibsonAiApi<AnalysisReportOut[]>("/analysis-report", "GET", undefined, { analyzed_by: userProfileId });
}

export async function updateAnalysisReportStatus(reportId: number, status: AnalysisReportStatus): Promise<AnalysisReportOut> {
  return callGibsonAiApi<AnalysisReportOut>(`/analysis-report/${reportId}`, "PATCH", { status });
}

// --- Analysis Summary Endpoints ---
interface AnalysisSummaryIn {
  report_id: number;
  summary_text: string;
}

export interface AnalysisSummaryOut {
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

export async function getAnalysisSummaryByReportId(reportId: number): Promise<AnalysisSummaryOut | null> {
  const summaries = await callGibsonAiApi<AnalysisSummaryOut[]>("/analysis-summary", "GET", undefined, { report_id: reportId });
  return summaries.length > 0 ? summaries[0] : null;
}

// --- Analysis Score Endpoints ---
interface AnalysisScoreIn {
  report_id: number;
  score: number;
  section: string;
}

export interface AnalysisScoreOut {
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

export async function getAnalysisScoreByReportId(reportId: number): Promise<AnalysisScoreOut | null> {
  const scores = await callGibsonAiApi<AnalysisScoreOut[]>("/analysis-score", "GET", undefined, { report_id: reportId });
  return scores.length > 0 ? scores[0] : null;
}