import { useEffect, useState } from "react";
import api from "../../api";
import ImageUpload from "../../components/ImageUpload";
import VideoUpload from "../../components/VideoUpload";

export default function AdminDoctorVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadType, setUploadType] = useState("youtube"); // "youtube" or "local"
  const [form, setForm] = useState({
    id: "",
    title: "",
    doctor_name: "",
    designation: "",
    video_url: "",
    video_type: "youtube",
    thumbnail_url: "",
    description: "",
    duration: "",
    active: true,
    display_order: 0,
  });
  const [editMode, setEditMode] = useState(false);

  const loadVideos = async () => {
    try {
      const res = await api.get("/doctor-videos");
      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load doctor videos:", err);
      setError("Failed to load videos. Please refresh the page.");
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const resetForm = () => {
    setForm({
      id: "",
      title: "",
      doctor_name: "",
      designation: "",
      video_url: "",
      video_type: "youtube",
      thumbnail_url: "",
      description: "",
      duration: "",
      active: true,
      display_order: 0,
    });
    setUploadType("youtube");
    setEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleEdit = (video) => {
    console.log("Editing video:", video);
    console.log("Video ID:", video._id || video.id);
    setForm({
      id: video._id || video.id,
      title: video.title,
      doctor_name: video.doctor_name,
      designation: video.designation,
      video_url: video.video_url,
      video_type: video.video_type || "youtube",
      thumbnail_url: video.thumbnail_url || "",
      description: video.description || "",
      duration: video.duration || "",
      active: video.active,
      display_order: video.display_order || 0,
    });
    setUploadType(video.video_type || "youtube");
    setEditMode(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!form.title || !form.doctor_name || !form.designation || !form.video_url) {
      setError("Title, doctor name, designation, and video URL are required");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: form.title,
        doctor_name: form.doctor_name,
        designation: form.designation,
        video_url: form.video_url,
        video_type: uploadType,
        thumbnail_url: form.thumbnail_url,
        description: form.description,
        duration: form.duration,
        active: form.active,
        display_order: form.display_order,
      };

      if (editMode && form.id) {
        payload._id = form.id;
      }

      if (editMode) {
        await api.put(`/doctor-videos/${form.id}`, payload);
        setSuccess("✅ Doctor video updated successfully! The video is now live on the home page.");
      } else {
        await api.post("/doctor-videos", payload);
        setSuccess("🎉 Doctor video added successfully! The video is now visible on the home page.");
      }

      resetForm();
      loadVideos();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Save video error:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to save doctor video";
      if (err.response?.status === 401) {
        setError("Authentication failed. Please logout and login again.");
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    console.log("Deleting video with ID:", id);
    
    if (!window.confirm("Are you sure you want to delete this video?")) {
      return;
    }

    try {
      console.log("Sending DELETE request to:", `/doctor-videos/${id}`);
      await api.delete(`/doctor-videos/${id}`);
      setSuccess("🗑️ Doctor video deleted successfully!");
      loadVideos();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Delete video error:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to delete doctor video";
      if (err.response?.status === 401) {
        setError("Authentication failed. Please logout and login again.");
      } else {
        setError(errorMsg);
      }
    }
  };

  const handleCancel = () => {
    resetForm();
    setError("");
    setSuccess("");
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Doctor Videos</h1>
        <p className="admin-subtitle">Add or edit doctor interview videos for the home page</p>
      </div>

      {error && (
        <div className="alert error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {success && (
        <div className="alert success">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess("")}>✕</button>
        </div>
      )}

      <div className="admin-form-card">
        <h2>{editMode ? "Edit Doctor Video" : "Add New Doctor Video"}</h2>
        <form onSubmit={submit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Video Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Benefits of Sea Moss for Immunity"
                required
              />
            </div>

            <div className="form-group">
              <label>Display Order</label>
              <input
                type="number"
                name="display_order"
                value={form.display_order}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Doctor Name *</label>
              <input
                type="text"
                name="doctor_name"
                value={form.doctor_name}
                onChange={handleChange}
                placeholder="Dr. Priya Sharma"
                required
              />
            </div>

            <div className="form-group">
              <label>Designation *</label>
              <input
                type="text"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="MBBS, MD - Integrative Medicine"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Video Source *</label>
            <div className="video-source-tabs">
              <button
                type="button"
                className={`tab-btn ${uploadType === "youtube" ? "active" : ""}`}
                onClick={() => {
                  setUploadType("youtube");
                  setForm({ ...form, video_type: "youtube", video_url: "" });
                }}
              >
                🎥 YouTube URL
              </button>
              <button
                type="button"
                className={`tab-btn ${uploadType === "local" ? "active" : ""}`}
                onClick={() => {
                  setUploadType("local");
                  setForm({ ...form, video_type: "local", video_url: "" });
                }}
              >
                📤 Upload Video
              </button>
            </div>

            {uploadType === "youtube" ? (
              <div className="youtube-input">
                <input
                  type="url"
                  name="video_url"
                  value={form.video_url}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <small>Enter the full YouTube URL</small>
              </div>
            ) : (
              <VideoUpload
                label="Upload Video File"
                currentVideo={form.video_url}
                onUploadSuccess={(url) => setForm({ ...form, video_url: url })}
              />
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Thumbnail Image (Optional)</label>
              <ImageUpload
                label="Video Thumbnail"
                currentImage={form.thumbnail_url}
                onUploadSuccess={(url) => setForm({ ...form, thumbnail_url: url })}
              />
              <small>Upload a custom thumbnail or leave blank for auto-generated</small>
            </div>

            <div className="form-group">
              <label>Duration (Optional)</label>
              <input
                type="text"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="8:45"
              />
              <small>Format: MM:SS or HH:MM:SS</small>
            </div>
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Learn how sea moss can boost your immune system..."
              rows="3"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              <span>Active (visible on website)</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Saving..." : editMode ? "Update Video" : "Add Video"}
            </button>
            {editMode && (
              <button type="button" className="btn ghost" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-list-card">
        <h2>Existing Doctor Videos ({videos.length})</h2>
        {videos.length === 0 ? (
          <p className="empty-message">No doctor videos found. Add your first video above.</p>
        ) : (
          <div className="video-list">
            {videos.map((video) => (
              <div key={video._id || video.id} className="video-item">
                <div className="video-thumbnail-preview">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  {video.duration && (
                    <span className="duration-badge">{video.duration}</span>
                  )}
                </div>
                <div className="video-details">
                  <h3>{video.title}</h3>
                  <p className="doctor-info">
                    <strong>{video.doctor_name}</strong> - {video.designation}
                  </p>
                  {video.description && (
                    <p className="description">{video.description}</p>
                  )}
                  <div className="video-meta">
                    <span className={`status-badge ${video.active ? 'active' : 'inactive'}`}>
                      {video.active ? '● Active' : '○ Inactive'}
                    </span>
                    <span className="order-badge">Order: {video.display_order}</span>
                  </div>
                </div>
                <div className="video-actions">
                  <button
                    onClick={() => handleEdit(video)}
                    className="btn-icon edit"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(video._id || video.id)}
                    className="btn-icon delete"
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
