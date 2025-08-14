import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  createResume,
  createJobDescription,
  createAnalysisReport,
  createAnalysisSummary,
  createAnalysisScore,
  createAnalysisRecommendation, // Import new function
} from '@/utils/gibsonAiApi';
import { analyzeResumeWithErnie, AnalysisResult } from '@/utils/ai';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { UploadCloud, Clipboard } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import { extractResumeText } from '@/utils/fileExtractionApi';
import { useAuth } from '@/hooks/use-auth';

const ResumeAnalyzer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [resumeInputMode, setResumeInputMode] = useState<'upload' | 'paste'>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisSummary, setAnalysisSummary] = useState<string>('');
  const [overallAtsScore, setOverallAtsScore] = useState<number | null>(null);
  const [categoryScores, setCategoryScores] = useState<AnalysisResult['categoryScores'] | null>(null);
  const [recommendations, setRecommendations] = useState<AnalysisResult['recommendations'] | null>(null); // New state for recommendations

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
        setResumeFile(file);
        setResumeText(''); // Clear pasted text if file is uploaded
      } else {
        showError("Please upload a PDF, DOC, or DOCX file.");
        setResumeFile(null);
      }
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
        setResumeFile(file);
        setResumeText(''); // Clear pasted text if file is uploaded
      } else {
        showError("Please upload a PDF, DOC, or DOCX file.");
        setResumeFile(null);
      }
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleAnalyze = async () => {
    let currentResumeContent = '';
    let resumeTitle = "Pasted Resume";

    if (resumeInputMode === 'upload') {
      if (!resumeFile) {
        showError("Please upload a resume file.");
        return;
      }
      setIsLoading(true);
      let extractionToastId: string | number | undefined;
      try {
        extractionToastId = showLoading("Extracting text from resume file...");
        const extractedData = await extractResumeText(resumeFile);
        currentResumeContent = extractedData.text;
        resumeTitle = extractedData.meta.filename;
        dismissToast(extractionToastId);
        showSuccess("Text extracted successfully!");
      } catch (error) {
        dismissToast(extractionToastId);
        console.error("Error during file extraction:", error);
        showError(`Failed to extract text from file: ${error instanceof Error ? error.message : String(error)}`);
        setIsLoading(false);
        return;
      }
    } else { // paste mode
      if (!resumeText.trim()) {
        showError("Please paste your resume content.");
        return;
      }
      currentResumeContent = resumeText;
    }

    if (!jobDescription.trim()) {
      showError("Please enter a job description to compare against.");
      setIsLoading(false); // Ensure loading is false if this check fails
      return;
    }

    setIsLoading(true);
    let analysisToastId: string | number | undefined;
    try {
      analysisToastId = showLoading("Analyzing resume and job description...");

      // Run analysis with ERNIE
      const analysisResult = await analyzeResumeWithErnie(currentResumeContent, jobDescription);
      setAnalysisSummary(analysisResult.summary);
      setOverallAtsScore(analysisResult.overallScore);
      setCategoryScores(analysisResult.categoryScores);
      setRecommendations(analysisResult.recommendations); // Set recommendations state

      dismissToast(analysisToastId);
      showSuccess("Analysis complete!");

      // Save to GibsonAI only if authenticated
      if (isAuthenticated && user) {
        const resumeResponse = await createResume({
          summary: currentResumeContent,
          title: resumeTitle,
          user_profile_id: user.id,
        });

        const jobDescriptionResponse = await createJobDescription({
          company_name: "User Input", // Placeholder
          description: jobDescription,
          title: "Job Description", // Placeholder
          location: "N/A", // Placeholder
          user_profile_id: user.id,
        });

        const analysisReportResponse = await createAnalysisReport({
          analyzed_by: user.id,
          job_description_id: jobDescriptionResponse.id,
          resume_id: resumeResponse.id,
        });

        await createAnalysisSummary({
          report_id: analysisReportResponse.id,
          summary_text: analysisResult.summary,
        });

        // Save overall score
        await createAnalysisScore({
          report_id: analysisReportResponse.id,
          score: analysisResult.overallScore,
          section: "Overall ATS Score",
        });

        // Save category scores
        for (const [category, score] of Object.entries(analysisResult.categoryScores)) {
          await createAnalysisScore({
            report_id: analysisReportResponse.id,
            score: score,
            section: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter
          });
        }

        // Save recommendations
        for (const [category, recommendationText] of Object.entries(analysisResult.recommendations)) {
          await createAnalysisRecommendation({
            report_id: analysisReportResponse.id,
            category: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter
            recommendation_text: recommendationText,
          });
        }

        showSuccess("Analysis results saved to your dashboard!");
      } else {
        showSuccess("Analysis complete! Log in to save your results to the dashboard.");
      }

    } catch (error) {
      console.error("Error during analysis:", error);
      if (error instanceof Error && error.message.includes("TooManyRequestsError")) {
        showError("It looks like there are too many AI requests. Please try again in 2-5 minutes.", 60000);
      } else if (error instanceof Error && error.message.includes("GibsonAI API Error")) {
        showError(`Failed to save data to dashboard: ${error.message}`);
      } else {
        showError("Failed to perform analysis. Please check your inputs and try again.");
      }
    } finally {
      setIsLoading(false);
      if (analysisToastId) {
        dismissToast(analysisToastId);
      }
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />

        <div className="flex flex-col items-center px-6 py-5 flex-1">
          <div className="w-full max-w-[1000px] border border-solid border-gray-300 rounded-md p-4 mb-6 bg-[#1E91D6] text-white text-center">
            <p className="text-base font-medium">Note: This tool helps analyze your resume against a job description.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[1000px]">
            {/* Resume Input Section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-app-dark-text tracking-light text-2xl font-bold leading-tight text-center">Your Resume</h3>
              <Tabs value={resumeInputMode} onValueChange={(value) => setResumeInputMode(value as 'upload' | 'paste')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload File
                  </TabsTrigger>
                  <TabsTrigger value="paste">
                    <Clipboard className="mr-2 h-4 w-4" /> Paste Text
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-4">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer min-h-[200px] text-gray-500 hover:border-gray-400 transition-colors"
                  >
                    <UploadCloud className="h-12 w-12 mb-3" />
                    <p className="text-lg font-medium">Drag & drop your resume here</p>
                    <p className="text-sm">or click to select file (PDF, DOC, DOCX)</p>
                    {resumeFile && <p className="mt-2 text-sm text-app-blue">Selected: {resumeFile.name}</p>}
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="paste" className="mt-4">
                  <Textarea
                    placeholder="Paste your resume content here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="min-h-[200px] max-h-80 overflow-y-auto resize-none rounded text-app-dark-text focus:outline-0 focus:ring-0 border border-app-input-border bg-white focus:border-app-input-border placeholder:text-app-placeholder p-[15px] text-base font-normal leading-normal"
                    disabled={isLoading}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Job Description Input Section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-app-dark-text tracking-light text-2xl font-bold leading-tight text-center">Job Description</h3>
              <Textarea
                placeholder="Paste the job description you want to compare your resume against."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] max-h-80 overflow-y-auto resize-none rounded text-app-dark-text focus:outline-0 focus:ring-0 border border-app-input-border bg-white focus:border-app-input-border placeholder:text-app-placeholder p-[15px] text-base font-normal leading-normal"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Analyze Button */}
          <div className="flex justify-center w-full max-w-[1000px] mt-8">
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || (resumeInputMode === 'upload' && !resumeFile) || (resumeInputMode === 'paste' && !resumeText.trim()) || !jobDescription.trim()}
              className="flex min-w-[250px] max-w-[600px] cursor-pointer items-center justify-center overflow-hidden rounded h-10 px-4 bg-app-blue text-white text-sm font-bold leading-normal tracking-[0.015em]"
            >
              <span className="truncate">{isLoading ? "Analyzing..." : "Analyze Resume"}</span>
            </Button>
          </div>

          {/* Analysis Results Section */}
          {(analysisSummary || overallAtsScore !== null) && (
            <div className="w-full max-w-[1000px] mt-8 p-6 border border-solid border-gray-300 rounded-md bg-gray-50">
              <h3 className="text-app-dark-text tracking-light text-2xl font-bold leading-tight text-center mb-4">Analysis Results</h3>
              {overallAtsScore !== null && (
                <div className="mb-4 text-center">
                  <p className="text-lg font-semibold text-app-dark-text">Overall ATS Score:</p>
                  <p className="text-4xl font-bold text-app-blue">{overallAtsScore}%</p>
                </div>
              )}
              {categoryScores && (
                <div className="mb-4">
                  <p className="text-lg font-semibold text-app-dark-text mb-2">Category Breakdown:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(categoryScores).map(([category, score]) => (
                      <div key={category} className="bg-white p-3 rounded border border-gray-200 text-app-dark-text">
                        <p className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}:</p>
                        <p className="text-xl font-bold text-app-blue">{score}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {recommendations && (
                <div className="mb-4">
                  <p className="text-lg font-semibold text-app-dark-text mb-2">Recommendations:</p>
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(recommendations).map(([category, recommendationText]) => (
                      <div key={category} className="bg-white p-3 rounded border border-gray-200 text-app-dark-text">
                        <p className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}:</p>
                        <p className="text-sm whitespace-pre-wrap">{recommendationText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analysisSummary && (
                <div>
                  <p className="text-lg font-semibold text-app-dark-text mb-2">Summary:</p>
                  <div className="bg-white p-4 rounded border border-gray-200 text-app-dark-text whitespace-pre-wrap">
                    {analysisSummary}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <AppFooter />
      </div>
    </div>
  );
};

export default ResumeAnalyzer;