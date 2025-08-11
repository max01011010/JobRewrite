import React from 'react';

const ERNIEAttribution: React.FC = () => {
  return (
    <div className="w-full max-w-[1000px] mx-auto mt-8 p-4 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
      <p className="mb-2">
        If you find ERNIE 4.5 useful or wish to use it in your projects, please kindly cite our technical report:
      </p>
      <pre className="bg-gray-100 p-3 rounded-sm overflow-x-auto text-xs dark:bg-gray-900 dark:text-gray-400">
        <code>
          @misc&#123;ernie2025technicalreport,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;title=&#123;ERNIE 4.5 Technical Report&#125;,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;author=&#123;Baidu ERNIE Team&#125;,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;year=&#123;2025&#125;,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;eprint=&#123;&#125;,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;archivePrefix=&#123;arXiv&#125;,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;primaryClass=&#123;cs.CL&#125;,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;url=&#123;&#125;<br />
          &#125;
        </code>
      </pre>
    </div>
  );
};

export default ERNIEAttribution;