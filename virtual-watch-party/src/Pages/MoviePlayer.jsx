import { useRef, useState } from "react";
import "./MoviePlayer.css";

const participants = [
    { name: "You (Host)", status: "Online", initial: "Y" },
    { name: "Sarah Khan", status: "Online", initial: "S" },
    { name: "Ahmed Raza", status: "Online", initial: "A" },
    { name: "Hina Malik", status: "Online", initial: "H" },
    { name: "Usman Ali", status: "Online", initial: "U" },
];

const posterImages = {
    "poster-inception": "/images/inception.jpg",
    "poster-interstellar": "/images/interstellar.jpg",
    "poster-batman": "/images/batmanjpg.jpg",
    "poster-dune": "/images/dune.jpg",
};

function MoviePlayer({ event, onBack }) {
    const title = event?.title || "Watch Party";
    const posterClass = event?.posterClass || event?.poster_class;
    const posterImage = event?.posterUrl || event?.poster_url || posterImages[posterClass];
    const videoUrl = event?.videoUrl || event?.video_url || "";
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState("1");
    const [videoError, setVideoError] = useState("");
    const videoRef = useRef(null);

    function formatTime(seconds) {
        if (!Number.isFinite(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${minutes}:${remainingSeconds}`;
    }

    function togglePlayback() {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().catch(() => setVideoError("This video could not be played by your browser."));
        } else {
            video.pause();
        }
    }

    function seekVideo(event) {
        const nextTime = Number(event.target.value);
        if (videoRef.current) videoRef.current.currentTime = nextTime;
        setCurrentTime(nextTime);
    }

    function changePlaybackRate(event) {
        const nextRate = event.target.value;
        setPlaybackRate(nextRate);
        if (videoRef.current) videoRef.current.playbackRate = Number(nextRate);
    }

    return (
        <main className="dashboard-shell movie-shell">
            <section className="dashboard-phone movie-player-phone" aria-label={`${title} movie player`}>
                <header className="movie-header-row">
                    <div className="movie-header-label">
                        <button type="button" className="movie-back-button" onClick={onBack} aria-label="Back to events">‹</button>
                        <div>
                            <span className="movie-room-eyebrow">WATCH PARTY</span>
                            <h1>{title}</h1>
                        </div>
                    </div>
                    <div className="movie-header-actions">
                        <span className="room-live-indicator"><span /> Room is live</span>
                        <button type="button" className="end-room-button" onClick={onBack}>End Room</button>
                    </div>
                </header>

                <div className="movie-layout">
                    <section className="movie-main" aria-label="Movie playback">
                        <div
                            className="movie-video-panel"
                            aria-label={`${title} movie player`}
                            style={posterImage ? { backgroundImage: `url("${posterImage}")` } : undefined}
                        >
                            {videoUrl ? (
                                <video
                                    ref={videoRef}
                                    className="movie-video"
                                    src={videoUrl}
                                    preload="metadata"
                                    playsInline
                                    muted={isMuted}
                                    onLoadedMetadata={(videoEvent) => {
                                        setDuration(videoEvent.currentTarget.duration);
                                        videoEvent.currentTarget.playbackRate = Number(playbackRate);
                                    }}
                                    onTimeUpdate={(videoEvent) => setCurrentTime(videoEvent.currentTarget.currentTime)}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnded={() => setIsPlaying(false)}
                                    onError={() => setVideoError("This video format is not supported by your browser.")}
                                />
                            ) : (
                                <div className="video-empty-state">
                                    <span>This event has no video attached. Create an event and select a video to test playback.</span>
                                </div>
                            )}
                        </div>
                        {videoError && <p className="movie-video-error" role="alert">{videoError}</p>}

                        <div className="movie-progress-row">
                            <span>{formatTime(currentTime)}</span>
                            <input
                                className="movie-seek"
                                type="range"
                                min="0"
                                max={duration || 0}
                                step="0.1"
                                value={Math.min(currentTime, duration || 0)}
                                onChange={seekVideo}
                                disabled={!videoUrl || !duration}
                                aria-label="Seek through movie"
                                style={{ "--seek-progress": `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                            <span>{formatTime(duration)}</span>
                        </div>

                        <div className="movie-controls">
                            <button type="button" aria-label={isPlaying ? "Pause" : "Play"} className="control-button small playback-toggle" onClick={togglePlayback} disabled={!videoUrl}>
                                {isPlaying ? "Ⅱ" : "▶"}
                            </button>
                            <button type="button" aria-label={isMuted ? "Unmute" : "Mute"} className="control-button small" onClick={() => setIsMuted((muted) => !muted)} disabled={!videoUrl}>
                                {isMuted ? "◌" : "◖"}
                            </button>
                            <label className="playback-speed-control">
                                <span>Speed</span>
                                <select value={playbackRate} onChange={changePlaybackRate} disabled={!videoUrl} aria-label="Playback speed">
                                    <option value="0.5">0.5x</option>
                                    <option value="0.75">0.75x</option>
                                    <option value="1">1x</option>
                                    <option value="1.25">1.25x</option>
                                    <option value="1.5">1.5x</option>
                                    <option value="2">2x</option>
                                </select>
                            </label>
                        </div>
                    </section>

                    <aside className="movie-participants" aria-label="Room participants">
                        <div className="participants-heading">
                            <h2>In the room</h2>
                            <span>{participants.length}</span>
                        </div>
                        <div className="room-members">
                            {participants.map((person) => (
                                <div key={person.name} className="member-item">
                                    <div className="member-avatar">{person.initial}</div>
                                    <div className="member-text">
                                        <span>{person.name}</span>
                                        <small><i />{person.status}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}

export default MoviePlayer;
