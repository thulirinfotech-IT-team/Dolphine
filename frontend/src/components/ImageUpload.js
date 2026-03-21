import { useState } from "react";
import axios from "axios";

export default function ImageUpload({ onUploadSuccess, currentImage, label = "Upload Image" }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || "");
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, GIF, and WebP images are allowed");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:8000/api/upload/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const imageUrl = `http://localhost:8000${response.data.url}`;
      setPreview(imageUrl);

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(imageUrl);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload image");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload-wrapper">
      <label className="image-upload-label">{label}</label>

      <div className="image-upload-container">
        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
          </div>
        )}

        <div className="upload-controls">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="file-input"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="file-input-label">
            {uploading ? "Uploading..." : preview ? "Change Image" : "Choose Image"}
          </label>

          {error && <div className="upload-error">{error}</div>}

          <p className="upload-hint">JPG, PNG, GIF or WebP (max 5MB)</p>
        </div>
      </div>
    </div>
  );
}
