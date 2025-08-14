import React, { useState } from 'react';
import JobTextarea from '@/components/JobTextarea';
import { Button } from '@/components/ui/button';
import { rewriteJobDescription } from '@/utils/ai';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import AppFooter from '@/components/AppFooter';
import { useAuth } from '@/hooks/use-auth';
import { createResume, createJobDescription } from '@/utils/gibsonAiApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RewriteHistoryEntry {
  previousRole: string;
  rewrittenRole: string;
}

const Index: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [jobDescription, setJobDescription] = useState<string>('');
  const [rewrittenResume, setRewrittenResume] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rewriteHistory, setRewriteHistory] = useState<RewriteHistoryEntry[]>([]); // New state for history

  const handleRewrite = async () => {
    if (!jobDescription.trim()) {
      showError("Please enter a job description to rewrite.");
      return;
    }

    setIsLoading(true);
    let toastId: string | number | undefined;
    try {
      toastId = showLoading("Rewriting job description...");
      const rewrittenText = await rewriteJobDescription(jobDescription);
      setRewrittenResume(rewrittenText);
      showSuccess("Job description rewritten successfully!");

      // Add to session history, keeping only the 3 most recent
      setRewriteHistory(prevHistory => {
        const newHistory = [{ previousRole: jobDescription, rewrittenRole: rewrittenText }, ...prevHistory];
        return newHistory.slice(0, 3);
      });

      // Save original job description and rewritten resume to GibsonAI only if authenticated
      if (isAuthenticated && user) {
        await createJobDescription({
          company_name: "User Input", // Placeholder
          description: jobDescription,
          title: "Original Job Description", // Placeholder
          location: "N/A", // Placeholder
          user_profile_id: user.id,
        });

        await createResume({
          summary: rewrittenText,
          title: "Rewritten Job Description", // Placeholder
          user_profile_id: user.id,
        });
        showSuccess("Your rewrite has been saved to your dashboard!");
      } else {
        showSuccess("Rewrite complete! Log in to save your results to the dashboard.");
      }

    } catch (error) {
      console.error("Error during rewrite:", error);
      if (error instanceof Error && error.message === "TooManyRequestsError") {
        showError("It looks like there are too many rewrite requests on the server. Please try again in 2-5 minutes.", 60000);
      } else {
        showError("Failed to rewrite job description. Please try again.");
      }
    } finally {
      setIsLoading(false);
      if (toastId) {
        dismissToast(toastId);
      }
    }
  };

  const handleCopy = () => {
    if (!rewrittenResume.trim()) {
      showError("Nothing to copy. Please rewrite a job description first.");
      return;
    }
    navigator.clipboard.writeText(rewrittenResume);
    showSuccess("Rewritten resume copied to clipboard!");
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-col items-center px-6 py-5">
          <div className="w-full max-w-[1000px] border border-solid border-gray-300 rounded-md p-4 mb-6 bg-[#1E91D6] text-white text-center">
            <p className="text-base font-medium">Note: Please replace the placeholder metrics provided to align with real data you've achieved and gathered.</p>
          </div>
          <div className="gap-1 flex flex-1 w-full">
            <div className="layout-content-container flex flex-col flex-1">
              <h3 className="text-app-dark-text tracking-light text-2xl font-bold leading-tight px-4 text-center pb-2 pt-5">Previous Role</h3>
              <div className="flex flex-wrap items-end gap-4 px-4 py-3">
                <JobTextarea
                  placeholder="Enter one of your previous roles listed in your resume or the job description of your previous role."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="flex px-4 py-3 justify-center">
                <Button
                  onClick={handleRewrite}
                  disabled={isLoading}
                  className="flex min-w-[250px] max-w-[600px] cursor-pointer items-center justify-center overflow-hidden rounded h-10 px-4 bg-app-blue text-white text-sm font-bold leading-normal tracking-[0.015em]"
                >
                  <span className="truncate">{isLoading ? "Rewriting..." : "Rewrite"}</span>
                </Button>
              </div>
            </div>
            <div className="layout-content-container flex flex-col flex-1">
              <h3 className="text-app-dark-text tracking-light text-2xl font-bold leading-tight px-4 text-center pb-2 pt-5">Rewritten Role</h3>
              <div className="flex flex-wrap items-end gap-4 px-4 py-3">
                <JobTextarea
                  disabled
                  value={rewrittenResume}
                  placeholder="Your rewritten role will appear here."
                />
              </div>
              <div className="flex justify-center">
                <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 max-w-[480px] justify-center">
                  <Button
                    onClick={handleCopy}
                    disabled={!rewrittenResume.trim()}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded h-10 px-4 bg-app-light-border text-app-dark-text text-sm font-bold leading-normal tracking-[0.015em] grow"
                  >
                    <span className="truncate">Copy</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Session History Section */}
          {rewriteHistory.length > 0 && (
            <div className="w-full max-w-[1000px] mt-8 p-6 border border-solid border-gray-300 rounded-md bg-gray-50">
              <h3 className="text-app-dark-text tracking-light text-2xl font-bold leading-tight text-center mb-4">Recent Rewrites (Current Session)</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                This log is only available for your review during this visit and will not be saved.
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/2">Previous Role</TableHead>
                      <TableHead className="w-1/2">Rewritten Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewriteHistory.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell className="align-top whitespace-pre-wrap max-w-xs overflow-hidden text-ellipsis">{entry.previousRole}</TableCell>
                        <TableCell className="align-top whitespace-pre-wrap max-w-xs overflow-hidden text-ellipsis">{entry.rewrittenRole}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default Index;