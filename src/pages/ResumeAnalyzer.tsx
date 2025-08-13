import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  createResume,
  createJobDescription,
  createAnalysisReport,
  createAnalysisSummary,
  createAnalysisScore,
} from '@/utils/gibsonAiApi';
import { analyzeResumeWithErnie } from '@/utils/ai'; // This function will be created next
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { UploadCloud, Clipboard } from 'lucide-react';

const ResumeAnalyzer: React.FC = () => {
  const [resumeInputMode, setResumeInputMode] = useState<'upload' | 'paste'>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisSummary, setAnalysisSummary] = useState<string>('');
  const [atsScore, setAtsScore] = useState<number | null>(null);

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

  // Placeholder for backend file extraction
  const extractTextFromFile = async (file: File): Promise<string> => {
    showError("File extraction requires a backend server. Please implement an API endpoint to process PDF/DOCX files using PDFMiner/docx2txt and return the text content.", 10000);
    console.warn("Simulating file extraction. In a real application, this would send the file to a backend for processing.");
    // Simulate a delay and return dummy text
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `[Extracted text from ${file.name}: This is a placeholder for the actual resume content that would be extracted by your backend using PDFMiner or docx2txt. Please replace this with real extracted text from your backend.]`;
  };

  const handleAnalyze = async () => {
    let currentResumeContent = '';

    if (resumeInputMode === 'upload') {
      if (!resumeFile) {
        showError("Please upload a resume file.");
        return;
      }
      currentResumeContent = await extractTextFromFile(resumeFile); // Simulate extraction
    } else { // paste mode
      if (!resumeText.trim()) {
        showError("Please paste your resume content.");
        return;
      }
      currentResumeContent = resumeText;
    }

    if (!jobDescription.trim()) {
      showError("Please enter a job description to compare against.");
      return;
    }

    setIsLoading(true);
    let toastId: string | number | undefined;
    try {
      toastId = showLoading("Analyzing resume and job description...");

      // 1. Save resume and job description to GibsonAI
      const resumeResponse = await createResume({
        summary: currentResumeContent,
        title: resumeFile ? resumeFile.name : "Pasted Resume", // Use file name or generic title
        user_profile_id: 1, // Placeholder user ID
      });

      const jobDescriptionResponse = await createJobDescription({
        company_name: "Unknown Company", // Placeholder
        description: jobDescription,
        title: "Job Description", // Placeholder
        location: "Remote", // Placeholder
      });

      // 2. Run analysis with ERNIE
      const analysisResult = await analyzeResumeWithErnie(currentResumeContent, jobDescription);
      setAnalysisSummary(analysisResult.summary);
      setAtsScore(analysisResult.score);

      // 3. Save analysis report, summary, and score to GibsonAI
      const analysisReportResponse = await createAnalysisReport({
        analyzed_by: 1, // Placeholder user ID
        job_description_id: jobDescriptionResponse.id,
        resume_id: resumeResponse.id,
      });

      await createAnalysisSummary({
        report_id: analysisReportResponse.id,
        summary_text: analysisResult.summary,
      });

      await createAnalysisScore({
        report_id: analysisReportResponse.id,
        score: analysisResult.score,
        section: "Overall ATS Score", // Or break down by section if ERNIE provides it
      });

      showSuccess("Analysis complete and results saved!");
    } catch (error) {
      console.error("Error during analysis:", error);
      if (error instanceof Error && error.message.includes("TooManyRequestsError")) {
        showError("It looks like there are too many AI requests. Please try again in 2-5 minutes.", 60000);
      } else if (error instanceof Error && error.message.includes("GibsonAI API Error")) {
        showError(`Failed to save data to GibsonAI: ${error.message}`);
      } else {
        showError("Failed to perform analysis. Please check your inputs and try again.");
      }
    } finally {
      setIsLoading(false);
      if (toastId) {
        dismissToast(toastId);
      }
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-app-light-border px-10 py-3">
          <div className="flex items-center gap-4 text-app-dark-text">
            <div className="size-4 flex items-center justify-center">
              <img src="/pencil-icon.png" alt="JobRewrite Icon" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-app-dark-text text-lg font-bold leading-tight tracking-[-0.015em]">Resume Analyzer</h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-app-dark-text text-sm font-medium leading-normal" href="https://www.maxabardo.work/" target="_blank" rel="noopener noreferrer">Made for free by Max A</a>
            </div>
          </div>
        </header>

        <div className="flex flex-col items-center px-6 py-5 flex-1">
          <div className="w-full max-w-[1000px] border border-solid border-gray-300 rounded-md p-4 mb-6 bg-[#1E91D6] text-white text-center">
            <p className="text-base font-medium">Note: This tool helps analyze your resume against a job description. For file uploads, a backend service is required for text extraction.</p>
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
          {(analysisSummary || atsScore !== null) && (
            <div className="w-full max-w-[1000px] mt-8 p-6 border border-solid border-gray-300 rounded-md bg-gray-50">
              <h3 className="text-app-dark-text tracking-light text-2xl font-bold leading-tight text-center mb-4">Analysis Results</h3>
              {atsScore !== null && (
                <div className="mb-4 text-center">
                  <p className="text-lg font-semibold text-app-dark-text">ATS Score:</p>
                  <p className="text-4xl font-bold text-app-blue">{atsScore}%</p>
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

        <footer className="w-full py-2 text-center text-gray-500 dark:text-gray-400" style={{ fontSize: '9px' }}>
          <p>
            This app uses the ERNIE 4.5 model.
            Citation: Baidu ERNIE Team, ERNIE 4.5 Technical Report, 2025.
            <br />
            <a
              href="https://huggingface.co/baidu/ERNIE-4.5-21B-A3B-PT"
              target="_blank"
              rel="noopener noreferrer"
              className="text-app-blue hover:underline"
            >
              Learn more about ERNIE 4.5
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;