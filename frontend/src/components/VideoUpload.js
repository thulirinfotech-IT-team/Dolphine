import { useState } from "react";
import axios from "axios";

export default function VideoUpload({ onUploadSuccess, currentVideo, label = "Upload Video" }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentVideo || "");
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only MP4, MOV, AVI, MKV, and WebM videos are allowed");
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB");
      return;
    }

    setError("");
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:8000/api/upload/upload-video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      const videoUrl = `http://localhost:8000${response.data.url}`;
      setPreview(videoUrl);

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(videoUrl);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload video");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="video-upload-wrapper">
      <label className="video-upload-label">{label}</label>

      <div className="video-upload-container">
        {preview && (
          <div className="video-preview">
            <video controls width="100%" style={{ maxHeight: "300px", borderRadius: "12px" }}>
              <source src={preview} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        <div className="upload-controls">
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
            onChange={handleFileChange}
            disabled={uploading}
            className="file-input"
            id="video-upload"
          />
          <label htmlFor="video-upload" className="file-input-label">
            {uploading ? `Uploading... ${uploadProgress}%` : preview ? "Change Video" : "Choose Video"}
          </label>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}

          {error && <div className="upload-error">{error}</div>}

          <p className="upload-hint">MP4, MOV, AVI, MKV or WebM (max 100MB)</p>
        </div>
      </div>
    </div>
  );
}
