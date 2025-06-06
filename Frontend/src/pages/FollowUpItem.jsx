import React, { useState } from 'react';

const FollowUpItem = ({ question, answer, recommendation, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(prev => !prev);
    onClick(question, answer);
  };

  return (
    <li className="space-y-1">
      <div
        className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={handleClick}
      >
        {question}
      </div>
      {recommendation && isOpen && (
        <div className="text-xs text-gray-500 italic mt-1 pl-2 border-l-2 border-blue-200">
          {recommendation}
        </div>
      )}
    </li>
  );
};

export default FollowUpItem;
