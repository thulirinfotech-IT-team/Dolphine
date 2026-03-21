import { useState, useEffect } from "react";
import axios from "axios";
import "./MultipleImageUpload.css";

export default function MultipleImageUpload({ onImagesChange, currentImages = [], label = "Product Images" }) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  // Initialize images from currentImages prop
  useEffect(() => {
    if (currentImages && currentImages.length > 0) {
      setImages(currentImages);
    } else {
      // Clear images when currentImages is empty
      setImages([]);
    }
  }, [currentImages]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError("");
    setUploading(true);

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`${file.name}: Only JPG, PNG, GIF, and WebP images are allowed`);
        }

        // Validate file size
        if (file.size > maxSize) {
          throw new Error(`${file.name}: File size must be less than 5MB`);
        }

        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("token");
        const response = await axios.post("http://localhost:8000/api/upload/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        return `http://localhost:8000${response.data.url}`;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);

      // Notify parent component
      if (onImagesChange) {
        onImagesChange(newImages);
      }
    } catch (err) {
      setError(err.message || err.response?.data?.detail || "Failed to upload images");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);

    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);

    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  return (
    <div className="multiple-image-upload-wrapper">
      <label className="image-upload-label">{label}</label>

      <div className="multiple-image-container">
        {/* Image Grid */}
        {images.length > 0 && (
          <div className="image-grid">
            {images.map((url, index) => (
              <div key={index} className="image-item">
                {index === 0 && <span className="primary-badge">Primary</span>}
                <img src={url} alt={`Product ${index + 1}`} />
                <div className="image-actions">
                  <button
                    type="button"
                    className="btn-image-action"
                    onClick={() => removeImage(index)}
                    title="Remove image"
                  >
                    ✕
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      className="btn-image-action"
                      onClick={() => moveImage(index, index - 1)}
                      title="Move left"
                    >
                      ←
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      className="btn-image-action"
                      onClick={() => moveImage(index, index + 1)}
                      title="Move right"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Controls */}
        <div className="upload-controls">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="file-input"
            id="multiple-file-upload"
            multiple
          />
          <label htmlFor="multiple-file-upload" className="file-input-label">
            {uploading ? "Uploading..." : images.length > 0 ? "Add More Images" : "Choose Images"}
          </label>

          {error && <div className="upload-error">{error}</div>}

          <p className="upload-hint">
            JPG, PNG, GIF or WebP (max 5MB each). Select multiple files at once.
            {images.length > 0 && " First image will be the primary display image."}
          </p>
        </div>
      </div>
    </div>
  );
}
