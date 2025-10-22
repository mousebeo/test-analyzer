
import React, { useCallback, useRef } from 'react';
import { Role } from '../types';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  fileCount: number;
  isAIEnabled: boolean;
  onIsAIEnabledChange: (isAI: boolean) => void;
  role: Role;
  onRoleChange: (role: Role) => void;
}

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4h-2m-6-4l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

const AIToggle: React.FC<{ isEnabled: boolean; onChange: (enabled: boolean) => void }> = ({ isEnabled, onChange }) => (
    <div className="flex items-center justify-center mt-4">
        <label htmlFor="ai-toggle" className="flex items-center cursor-pointer">
            <div className="relative">
                <input
                    id="ai-toggle"
                    type="checkbox"
                    className="sr-only"
                    checked={isEnabled}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="block bg-gray-200 w-14 h-8 rounded-full"></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isEnabled ? 'translate-x-6 bg-indigo-600' : ''}`}></div>
            </div>
            <div className="ml-3 text-gray-700 font-medium">
                Enable AI Analysis <span className="text-xs text-gray-500">(slower, smarter)</span>
            </div>
        </label>
    </div>
);

const RoleSelector: React.FC<{
  selectedRole: Role;
  onRoleChange: (role: Role) => void;
  isDisabled: boolean;
}> = ({ selectedRole, onRoleChange, isDisabled }) => {
  const roles: Role[] = ['Executive', 'Administrator', 'Developer'];
  return (
      <div className={`mt-4 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
           <div className="text-gray-700 font-medium mb-2 text-center">Select AI Persona</div>
          <div className="flex bg-gray-200 rounded-lg p-1">
              {roles.map((role) => (
                  <button
                      key={role}
                      onClick={() => !isDisabled && onRoleChange(role)}
                      disabled={isDisabled}
                      className={`w-full text-center px-2 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                          selectedRole === role
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-gray-600 hover:bg-gray-300'
                      }`}
                  >
                      {role}
                  </button>
              ))}
          </div>
      </div>
  );
};


export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, onAnalyze, isLoading, fileCount, isAIEnabled, onIsAIEnabledChange, role, onRoleChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    onFilesChange(files);
  }, [onFilesChange]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-indigo-600">1. Configure Analysis</h2>
      <div 
        className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
        onClick={handleButtonClick}
      >
        <UploadIcon />
        <p className="mt-2 text-gray-500">Click to browse or drag files here</p>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.log,.json,.hprof,.phd"
        />
        {fileCount > 0 && (
          <p className="mt-4 text-sm text-green-600">{fileCount} file(s) selected.</p>
        )}
      </div>
      <AIToggle isEnabled={isAIEnabled} onChange={onIsAIEnabledChange} />
      <RoleSelector selectedRole={role} onRoleChange={onRoleChange} isDisabled={!isAIEnabled} />
      <button
        onClick={onAnalyze}
        disabled={isLoading || fileCount === 0}
        className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-indigo-500/50"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </>
        ) : `2. Analyze System ${isAIEnabled ? `(for ${role})` : '(Locally)'}`}
      </button>
    </div>
  );
};
