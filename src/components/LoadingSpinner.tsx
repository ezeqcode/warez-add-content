import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className={`h-full w-full opacity-40 flex justify-center items-center `}>
      <div
        className="w-12 h-12 rounded-full animate-spin
      border border-solid border-yellow-500 border-t-transparent shadow-md"
      />
    </div>
  );
};

export default LoadingSpinner;