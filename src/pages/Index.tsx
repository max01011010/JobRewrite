import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import JobTextarea from '@/components/JobTextarea';
import { Button } from '@/components/ui/button'; // Using shadcn Button

const Index: React.FC = () => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [rewrittenResume, setRewrittenResume] = useState<string>('');

  const handleRewrite = () => {
    // Placeholder for rewrite logic
    console.log('Rewriting job description:', jobDescription);
    setRewrittenResume('This is a rewritten version of the job description.');
  };

  const handleCopy = () => {
    // Placeholder for copy logic
    navigator.clipboard.writeText(rewrittenResume);
    console.log('Copied rewritten resume:', rewrittenResume);
    // You might want to add a toast notification here
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />
        <div className="gap-1 px-6 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-80">
            <h3 className="text-app-dark-text tracking-light text-2xl font-bold leading-tight px-4 text-center pb-2 pt-5">Job Description</h3>
            <div className="flex max-w-[600px] flex-wrap items-end gap-4 px-4 py-3">
              <JobTextarea
                placeholder="Enter job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <div className="flex px-4 py-3 justify-center">
              <Button
                onClick={handleRewrite}
                className="flex min-w-[250px] max-w-[600px] cursor-pointer items-center justify-center overflow-hidden rounded h-10 px-4 bg-app-blue text-white text-sm font-bold leading-normal tracking-[0.015em]"
              >
                <span className="truncate">Rewrite</span>
              </Button>
            </div>
          </div>
          <div className="layout-content-container flex flex-col max-w-[600px] flex-1">
            <h3 className="text-app-dark-text tracking-light text-2xl font-bold leading-tight px-4 text-center pb-2 pt-5">Rewritten Resume</h3>
            <div className="flex max-w-[600px] flex-wrap items-end gap-4 px-4 py-3">
              <JobTextarea
                disabled
                value={rewrittenResume}
                placeholder="Rewritten resume will appear here..."
              />
            </div>
            <div className="flex justify-center">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 max-w-[480px] justify-center">
                <Button
                  onClick={handleCopy}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded h-10 px-4 bg-app-light-border text-app-dark-text text-sm font-bold leading-normal tracking-[0.015em] grow"
                >
                  <span className="truncate">Copy</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;