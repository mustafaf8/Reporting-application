import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 mb-6">
        {icon || (
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title || "Veri bulunamadı"}
      </h3>

      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}

      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
