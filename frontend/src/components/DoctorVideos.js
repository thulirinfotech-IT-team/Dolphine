import { useEffect, useState } from "react";
import api from "../api";

export default function DoctorVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await api.get("/doctor-videos/");
        setVideos(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load doctor videos:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, []);

  const [selectedVideo, setSelectedVideo] = useState(null);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  // Determine if video is local or YouTube
  const isLocalVideo = (video) => {
    return video.video_type === "local" || video.video_url.includes("/uploads/videos/");
  };

  // Local video placeholder as inline SVG data URI (no external dependency)
  const LOCAL_VIDEO_PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%23e2e8f0'/%3E%3Cpolygon points='130,60 130,120 190,90' fill='%2394a3b8'/%3E%3Ctext x='160' y='150' text-anchor='middle' font-family='Arial' font-size='14' fill='%2364748b'%3ELocal Video%3C/text%3E%3C/svg%3E";

  // Get thumbnail for video
  const getVideoThumbnail = (video) => {
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    if (isLocalVideo(video)) {
      return LOCAL_VIDEO_PLACEHOLDER;
    }
    return getYouTubeThumbnail(video.video_url);
  };

  // Open video in modal or new tab
  const handleVideoClick = (video) => {
    if (isLocalVideo(video)) {
      // Open local video in modal
      setSelectedVideo(video);
    } else {
      const videoId = getYouTubeVideoId(video.video_url);
      if (videoId) {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
      } else {
        window.open(video.video_url, "_blank");
      }
    }
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };

  if (loading) {
    return <div className="doctor-videos-loading">Loading doctor videos...</div>;
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <>
      <section className="doctor-videos">
        <div className="section-header">
          <h2>Expert Doctor Insights</h2>
          <p className="section-subtitle">
            Hear from medical professionals about the benefits of natural products
          </p>
        </div>
        <div className="video-grid">
          {videos.map((video) => (
            <div
              key={video.id || video._id}
              className="video-card"
              onClick={() => handleVideoClick(video)}
            >
              <div className="video-thumbnail">
                <img
                  src={getVideoThumbnail(video)}
                  alt={video.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = LOCAL_VIDEO_PLACEHOLDER;
                  }}
                />
                <div className="play-overlay">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="white"
                    className="play-icon"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {video.duration && (
                  <span className="video-duration">{video.duration}</span>
                )}
              </div>
              <div className="video-info">
                <h3 className="video-title">{video.title}</h3>
                <p className="doctor-info">
                  <strong>{video.doctor_name}</strong>
                  <span className="designation">{video.designation}</span>
                </p>
                {video.description && (
                  <p className="video-description">{video.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Modal for Local Videos */}
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>
            <div className="modal-content">
              <video controls autoPlay width="100%">
                <source src={selectedVideo.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="modal-info">
                <h3>{selectedVideo.title}</h3>
                <p className="doctor-info">
                  <strong>{selectedVideo.doctor_name}</strong>
                  <span className="designation">{selectedVideo.designation}</span>
                </p>
                {selectedVideo.description && (
                  <p className="video-description">{selectedVideo.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
