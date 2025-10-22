
import React from 'react';

interface SaveToKBButtonProps {
    onSave: () => void;
    isSaving: boolean;
    saveSuccess: boolean;
    saveError: string | null;
}

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
);

const SpinnerIcon = () => (
     <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const SaveToKBButton: React.FC<SaveToKBButtonProps> = ({ onSave, isSaving, saveSuccess, saveError }) => {
    return (
        <div className="relative">
            <button
                onClick={onSave}
                disabled={isSaving || saveSuccess}
                className={`bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center border border-indigo-200
                    ${isSaving || saveSuccess ? 'cursor-not-allowed' : ''}
                    ${saveSuccess ? 'bg-green-100 hover:bg-green-100 text-green-700 border-green-200' : ''}
                    ${saveError ? 'bg-red-100 hover:bg-red-100 text-red-700 border-red-200' : ''}
                `}
            >
                {isSaving && <SpinnerIcon />}
                {saveSuccess && <SuccessIcon />}
                {!isSaving && !saveSuccess && <SaveIcon />}
                {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save to Knowledge Base'}
            </button>
            {saveError && <p className="text-xs text-red-600 mt-1.5 absolute w-full text-center">{saveError}</p>}
        </div>
    );
};
