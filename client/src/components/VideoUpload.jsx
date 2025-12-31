import React, { useState, useRef } from 'react';
import axios from 'axios';
import './VideoUpload.css';

const VideoUpload = ({ onUploadSuccess }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            setFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('videos', file);
        });

        try {
            await axios.post('http://localhost:5000/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
            });
            setFiles([]);
            setProgress(0);
            onUploadSuccess();
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div
            className="upload-card card"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className="upload-content">
                <div className="upload-icon">📁</div>
                <h3>Drop videos here or click to browse</h3>
                <p className="subtitle">Support for multiple MP4, MOV, AVI files</p>

                <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                />

                <button
                    className="btn outline"
                    onClick={() => fileInputRef.current.click()}
                >
                    Select Files
                </button>

                {files.length > 0 && (
                    <div className="file-preview">
                        <p>{files.length} files selected</p>
                        <button
                            className="btn primary"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading ? `Uploading ${progress}%` : 'Upload Videos'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoUpload;
