import React from "react";

interface SpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "medium",
  className = "",
}) => {
  const sizeClass =
    size === "small" ? "w-5 h-5" : size === "large" ? "w-10 h-10" : "w-8 h-8";

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClass} border-t-blue-600 border-l-gray-300 border-r-gray-300 rounded-full border-4 border-b-transparent`}
        style={{ animation: "spin 1s linear infinite" }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `,
        }}
      />
    </div>
  );
};
