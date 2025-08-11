import React from 'react';

interface JobTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const JobTextarea: React.FC<JobTextareaProps> = ({ label, ...props }) => {
  return (
    <label className="flex flex-col min-w-40 flex-1">
      {label && <span className="mb-1 text-sm font-medium text-app-dark-text">{label}</span>}
      <textarea
        className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded text-app-dark-text focus:outline-0 focus:ring-0 border border-app-input-border bg-white focus:border-app-input-border min-h-36 placeholder:text-app-placeholder p-[15px] text-base font-normal leading-normal"
        {...props}
      ></textarea>
    </label>
  );
};

export default JobTextarea;