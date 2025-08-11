import React from 'react';

const AppFooter: React.FC = () => {
  return (
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
  );
};

export default AppFooter;