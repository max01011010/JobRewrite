import React, { useRef, useEffect } from 'react';

interface JobTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const JobTextarea: React.FC<JobTextareaProps> = ({ label, value, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to correctly calculate scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set height to scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]); // Re-run effect when the value changes

  return (
    <label className="flex flex-col min-w-40 flex-1">
      {label && <span className="mb-1 text-sm font-medium text-app-dark-text">{label}</span>}
      <textarea
        ref={textareaRef}
        className="flex w-full min-w-0 flex-1 resize-none rounded text-app-dark-text focus:outline-0 focus:ring-0 border border-app-input-border bg-white focus:border-app-input-border placeholder:text-app-placeholder p-[15px] text-base font-normal leading-normal"
        value={value}
        {...props}
      ></textarea>
    </label>
  );
};

export default JobTextarea;