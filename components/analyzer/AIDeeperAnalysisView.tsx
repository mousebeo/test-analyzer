import React from 'react';
import { AIDeeperAnalysis } from '../../types';

interface AIDeeperAnalysisViewProps {
    analysis: AIDeeperAnalysis;
    onBack: () => void;
}

export const AIDeeperAnalysisView: React.FC<AIDeeperAnalysisViewProps> = ({ analysis, onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in bg-gray-800 p-6 sm:p-8 rounded-lg">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-cyan-400">
                    Deeper AI Analysis Report
                </h2>
                <button 
                    onClick={onBack}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back to Summary
                </button>
            </div>

            <div className="space-y-6">
                {/* Detailed Narrative */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">Detailed Narrative</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{analysis.detailedNarrative}</p>
                </div>
                
                {/* Root Cause Analysis */}
                {analysis.rootCauseAnalysis && analysis.rootCauseAnalysis.length > 0 && (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">Root Cause Analysis</h3>
                        <div className="space-y-4">
                            {analysis.rootCauseAnalysis.map((item, index) => (
                                <div key={index} className="bg-gray-900/50 p-4 rounded-lg">
                                    <h4 className="font-bold text-cyan-400">{item.issue}</h4>
                                    <p className="mt-2 text-gray-300 whitespace-pre-wrap">{item.analysis}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Recommendations */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                     <div>
                        <h3 className="text-xl font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">Actionable Recommendations</h3>
                        <div className="space-y-3">
                           {analysis.recommendations.map((item, index) => (
                                <div key={index} className="flex items-start bg-gray-900/50 p-4 rounded-lg">
                                    <span className="bg-sky-800 text-sky-200 text-xs font-bold px-2 py-1 rounded-full mr-4 mt-1">{item.category}</span>
                                    <p className="text-gray-300 flex-1">{item.recommendation}</p>
                                </div>
                           ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
