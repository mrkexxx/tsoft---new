import React, { useState, useRef } from 'react';
import PageHeader from './PageHeader';
import Loader from './Loader';
import { generateVeoPromptsFromAudio } from '../services/geminiService';
import { VoiceAnalysisResult } from '../types';

interface VoiceToVeoGeneratorProps {
  onGoHome: () => void;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const styles = [
  'Default',
  'Điện ảnh (Cinematic)',
  'Hoạt hình (Animation)',
  'Hoạt hình 3D',
  'Anime',
  'Người que (Stick Figure)',
  'Tranh vẽ thuỷ mặc',
  'Realistic',
  'Cyberpunk',
  'Retro',
  'Documentary',
  'Fantasy'
];

const VoiceToVeoGenerator: React.FC<VoiceToVeoGeneratorProps> = ({ onGoHome }) => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
    const [style, setStyle] = useState<string>('Default');
    const [nationality, setNationality] = useState<string>('Default');
    const [duration, setDuration] = useState<number>(0);
    
    const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('audio/')) {
                setError('Vui lòng tải lên một tệp âm thanh hợp lệ (MP3, WAV, M4A, etc.).');
                setAudioFile(null);
                setAudioPreviewUrl(null);
                setDuration(0);
                return;
            }
            setAudioFile(file);
            const url = URL.createObjectURL(file);
            setAudioPreviewUrl(url);
            
            const audio = new Audio(url);
            audio.onloadedmetadata = () => {
                setDuration(audio.duration);
            };
            
            setAnalysisResult(null);
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!audioFile) {
            setError('Vui lòng tải lên file âm thanh.');
            return;
        }
        if (duration === 0) {
            setError('Không thể xác định độ dài file âm thanh. Vui lòng thử lại.');
            return;
        }
        setIsLoading(true);
        setLoadingMessage('AI đang nghe, phân tích và tạo prompt minh họa... (Quá trình này có thể mất vài phút)');
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await generateVeoPromptsFromAudio(audioFile, style, nationality, duration);
            setAnalysisResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPrompts = () => {
        if (!analysisResult) return;
        const content = analysisResult.scenes.map(s => s.veoPrompt).join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `voice_to_veo_prompts_${audioFile?.name.split('.')[0] || 'audio'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            {isLoading && <Loader message={loadingMessage} />}
            
            <PageHeader title="Tạo Prompt Veo3 từ Voice" onBack={onGoHome} />

            {error && (
                <div className="my-4 text-center bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Lỗi! </strong>
                    <span className="block sm:inline">{error}</span>
                    <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
                </div>
            )}

            <div className="space-y-8">
                {/* --- Step 1: Upload & Settings --- */}
                <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-6">
                    <h2 className="text-2xl font-bold text-white">Bước 1: Tải lên Voice & Cấu hình</h2>
                    
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                        aria-label="Tải lên âm thanh"
                    />

                    {audioPreviewUrl ? (
                        <div className="text-center space-y-4 bg-gray-900/50 p-4 rounded-lg border border-dark-border">
                            <audio src={audioPreviewUrl} controls className="w-full" />
                            <div className="flex justify-between items-center px-2 text-sm text-dark-text-secondary">
                                <p className="truncate max-w-[200px]">{audioFile?.name}</p>
                                <p>{Math.round(duration)} giây</p>
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm text-brand-light-purple hover:underline"
                            >
                                Thay đổi file khác
                            </button>
                        </div>
                    ) : (
                        <div 
                            className="border-2 border-dashed border-dark-border rounded-lg p-8 text-center cursor-pointer hover:border-brand-purple transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div>
                                <UploadIcon />
                                <p className="text-dark-text-secondary">Nhấn để tải lên file ghi âm / voiceover</p>
                                <p className="text-xs text-gray-500 mt-1">MP3, WAV, M4A, etc.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-md font-medium text-dark-text-secondary mb-2">Phong cách Video</label>
                            <select
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-full p-3 bg-gray-900/50 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple"
                            >
                                {styles.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-md font-medium text-dark-text-secondary mb-2">Quốc tịch nhân vật (nếu có)</label>
                            <select
                                value={nationality}
                                onChange={(e) => setNationality(e.target.value)}
                                className="w-full p-3 bg-gray-900/50 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple"
                            >
                                <option value="Default">Tự động (Theo giọng nói)</option>
                                <option value="Châu Á">Châu Á</option>
                                <option value="Châu Âu">Châu Âu</option>
                                <option value="Châu Phi">Châu Phi</option>
                                <option value="Nam Mỹ">Nam Mỹ</option>
                            </select>
                        </div>
                    </div>

                    {duration > 0 && (
                        <p className="text-sm text-center text-yellow-400">
                            Dự kiến tạo {Math.ceil(duration / 8)} prompt (8s/prompt).
                        </p>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={!audioFile || isLoading}
                        className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                    >
                        Phân tích Voice & Tạo Prompt
                    </button>
                </div>

                {/* --- Step 2: Results --- */}
                {analysisResult && (
                    <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-white">Bước 2: Kết quả ({analysisResult.scenes.length} phân cảnh)</h2>
                        <p className="text-sm text-dark-text-secondary mb-4">Các prompt này được thiết kế để tạo video minh họa không lời (no dialogue), không chữ (no text), khớp với nội dung voiceover.</p>
                        
                        <div className="bg-gray-900/50 p-4 rounded-lg border border-dark-border">
                            <h3 className="text-lg font-semibold text-brand-light-purple mb-3">Nhân vật được xác định</h3>
                            {analysisResult.characters.length > 0 ? (
                                <ul className="space-y-2">
                                    {analysisResult.characters.map((char, idx) => (
                                        <li key={idx} className="text-sm">
                                            <span className="font-bold text-white">{char.name}:</span> <span className="text-dark-text-secondary">{char.description}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-dark-text-secondary">Không tìm thấy nhân vật cụ thể.</p>
                            )}
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {analysisResult.scenes.map((scene, index) => (
                                <div key={index} className="bg-gray-900/30 p-4 rounded-lg border border-dark-border/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-brand-purple">Cảnh {index + 1}</span>
                                        <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{scene.timeRange} (8s)</span>
                                    </div>
                                    <p className="text-sm text-dark-text-secondary italic mb-2">Nội dung voice: "{scene.transcript}"</p>
                                    <div className="bg-black/40 p-3 rounded text-sm text-gray-300 font-mono">
                                        {scene.veoPrompt}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleDownloadPrompts}
                            className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
                        >
                            <DownloadIcon />
                            Tải về toàn bộ Prompts (.txt)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceToVeoGenerator;