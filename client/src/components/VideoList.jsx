import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VideoList.css';

const VideoList = ({ refreshTrigger }) => {
    const [videos, setVideos] = useState([]);
    const navigate = useNavigate();

    const fetchVideos = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/videos');
            setVideos(response.data);
        } catch (error) {
            console.error('Error fetching videos', error);
        }
    };

    useEffect(() => {
        fetchVideos();
        // Polling is good, but clearing interval on unmount is crucial
        const interval = setInterval(fetchVideos, 3000);
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const handleClearDB = async (e) => {
        e.stopPropagation(); // Prevent bubbling if necessary
        if (window.confirm('Are you sure you want to delete all videos and data?')) {
            try {
                await axios.delete('http://localhost:5000/api/videos/clear');
                fetchVideos();
            } catch (error) {
                console.error('Failed to clear database', error);
                alert('Error clearing database');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'var(--success)';
            case 'processing': return 'var(--accent-secondary)';
            case 'error': return 'var(--error)';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div className="video-list-container">
            <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Evaluation Results</h2>
                <button
                    onClick={handleClearDB}
                    style={{
                        background: 'var(--error)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Clear Database
                </button>
            </div>

            <div className="video-grid">
                {videos.map((video) => (
                    <div
                        key={video._id}
                        className="card video-card animate-fade-in"
                        onClick={() => navigate(`/video/${video._id}`)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="video-header">
                            <span className="file-name" title={video.originalName}>{video.originalName}</span>
                            <span
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(video.status) }}
                            >
                                {video.status}
                            </span>
                        </div>

                        <div className="video-body">
                            {video.status === 'completed' ? (
                                <>
                                    <div className="score-container">
                                        <span className="score-label">Score</span>
                                        <span className="score-value">{video.score}</span>
                                    </div>
                                    <div className="details-container">
                                        <p><strong>Duration:</strong> {video.details?.duration_seconds}s</p>
                                        <p><strong>Length Score:</strong> {video.details?.length_score}</p>
                                        <p><strong>Complexity:</strong> {video.details?.complexity_score || 'N/A'}</p>
                                    </div>
                                    <div className="transcript-preview">
                                        {video.transcript ? video.transcript.substring(0, 100) + '...' : 'No transcript'}
                                    </div>
                                </>
                            ) : (
                                <div className="processing-placeholder">
                                    {video.status === 'error' ? 'Evaluation Failed' : 'Analyzing audio content...'}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VideoList;
