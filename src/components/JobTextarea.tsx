import React from 'react';

interface JobTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const JobTextarea: React.FC<JobTextareaProps> = ({ label, value, ...props }) => {
  return (
    <label className="flex flex-col min-w-40 flex-1">
      {label && <span className="mb-1 text-sm font-medium text-app-dark-text">{label}</span>}
      <textarea
        className="w-full min-h-[150px] h-full overflow-y-auto resize-none rounded text-app-dark-text focus:outline-0 focus:ring-0 border border-app-input-border bg-white focus:border-app-input-border placeholder:text-app-placeholder p-[15px] text-base font-normal leading-normal"
        style={{ maxHeight: 'calc(100vh - 250px)' }} // Adjusted max-height to ensure button visibility
        value={value}
        {...props}
      ></textarea>
    </label>
  );
};

export default JobTextarea;