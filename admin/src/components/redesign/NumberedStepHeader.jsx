import React from 'react';

/**
 * NumberedStepHeader - Premium pink-themed numbered step header
 * Used in AddNewProductPage to show step numbers ①②③④⑤⑥⑦
 */
const NumberedStepHeader = ({ stepNumber, title, description }) => {
  return (
    <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 px-6 py-4 border-b border-pink-300">
      <div className="flex items-center gap-4">
        {/* Numbered Circle Badge */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-white">
          <span className="text-2xl font-bold bg-gradient-to-br from-pink-600 to-rose-600 bg-clip-text text-transparent">
            {stepNumber}
          </span>
        </div>

        {/* Title and Description */}
        <div>
          <h2 className="text-lg font-bold text-white">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-pink-100 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NumberedStepHeader;
