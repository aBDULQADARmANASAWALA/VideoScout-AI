import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VideoDetails.css'; // I will create this css next or reuse basics
import './VideoList.css'; // Reuse some basic styles

const VideoDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchVideo();
    }, [id]);

    const fetchVideo = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/videos/${id}`);
            setVideo(response.data);
            setNewName(response.data.originalName);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch video details');
            setLoading(false);
        }
    };

    const handleOpenFolder = async () => {
        try {
            await axios.post(`http://localhost:5000/api/videos/${id}/open`);
        } catch (err) {
            console.error('Failed to open folder', err);
            alert('Could not open folder');
        }
    };

    const handleSaveName = async () => {
        try {
            await axios.put(`http://localhost:5000/api/videos/${id}`, {
                originalName: newName
            });
            setVideo({ ...video, originalName: newName });
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update name', err);
            alert('Failed to update file name');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!video) return <div className="error">Video not found</div>;

    return (
        <div className="video-details-container container">
            <button className="back-btn" onClick={() => navigate('/')}>
                &larr; Back to List
            </button>

            <div className="details-header">
                {isEditing ? (
                    <div className="edit-name-container">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="edit-input"
                        />
                        <button onClick={handleSaveName} className="save-btn">Save</button>
                        <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                    </div>
                ) : (
                    <div className="title-container">
                        <h1>{video.originalName}</h1>
                        <button onClick={() => setIsEditing(true)} className="edit-btn" title="Edit Name">
                            &#9998;
                        </button>
                    </div>
                )}

                <div className="score-badge main-score">
                    Score: {video.score}
                </div>
            </div>

            <div className="details-grid">
                <div className="detail-card">
                    <h2>File Info</h2>
                    <p><strong>Status:</strong> {video.status}</p>
                    <p><strong>Path:</strong> {video.path}</p>
                    <button onClick={handleOpenFolder} className="action-btn">
                        Open File in Explorer
                    </button>
                </div>

                <div className="detail-card">
                    <h2>Scoring Details</h2>
                    {video.details ? (
                        <ul className="details-list">
                            <li><strong>Duration:</strong> {video.details.duration_seconds}s</li>
                            <li><strong>Length Score:</strong> {video.details.length_score}</li>
                            <li><strong>Grammar Score:</strong> {video.details.grammar_score}</li>
                            <li><strong>Complexity Score:</strong> {video.details.complexity_score || 'N/A'}</li>
                            <li><strong>Reading Ease:</strong> {video.details.reading_ease || 'N/A'}</li>
                            <li><strong>Raw Total:</strong> {video.details.raw_total || 'N/A'}</li>
                        </ul>
                    ) : (
                        <p>No details available</p>
                    )}
                </div>
            </div>

            <div className="transcript-section">
                <h2>Transcript</h2>
                <div className="transcript-box">
                    {video.transcript || 'No transcript available.'}
                </div>
            </div>
        </div>
    );
};

export default VideoDetails;
