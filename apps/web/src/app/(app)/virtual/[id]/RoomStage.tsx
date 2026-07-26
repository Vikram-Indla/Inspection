"use client";
// WA-DES-044 / SCR-VIR-700 — the inspection room panel.
//
// What is REAL here: camera, microphone and screen share. They are browser
// capabilities (getUserMedia / getDisplayMedia), so they need no vendor, no
// token and no network — the inspector can check their devices, frame
// themselves and rehearse a screen share before anyone joins.
//
// What is NOT real, and is never dressed up as real: the remote leg. That
// needs a Twilio Video room and a signed AccessToken (see
// lib/providers/video-twilio.ts). While those credentials are absent the
// remote tile states the reason instead of showing an empty "waiting" frame.
//
// SB19 — every string is built server-side with t() and passed in as props.
import { useCallback, useEffect, useRef, useState } from "react";

export type RoomStageStrings = {
  title: string;
  statusReady: string;
  statusNotReady: string;
  stateConnected: string;
  stateLocalOnly: string;
  stateUnavailable: string;
  remoteWaiting: string;
  remoteUnavailable: string;
  remoteUnavailableReason: string;
  selfView: string;
  cameraOff: string;
  cameraOn: string;
  micOff: string;
  micOn: string;
  share: string;
  shareStop: string;
  leave: string;
  /** Used instead of `leave` when no room can exist — see the comment at its
   *  call site: naming it "Leave room" would be a join affordance for a room
   *  that cannot be joined (precedent: 5fa170a7 on the field route). */
  stopDevices: string;
  sharingLabel: string;
  note: string;
  // device failures — distinct causes, never collapsed into one message
  errDenied: string;
  errNotFound: string;
  errBusy: string;
  errUnsupported: string;
  errGeneric: string;
};

type MediaFailure = keyof Pick<
  RoomStageStrings,
  "errDenied" | "errNotFound" | "errBusy" | "errUnsupported" | "errGeneric"
>;

/** Map a real DOMException to a distinct operator-facing cause. */
function classify(err: unknown): MediaFailure {
  const name = (err as { name?: string } | null)?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError") return "errDenied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "errNotFound";
  if (name === "NotReadableError" || name === "AbortError") return "errBusy";
  if (name === "TypeError") return "errUnsupported";
  return "errGeneric";
}

const ICON = {
  viewBox: "0 0 24 24",
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconMic({ muted }: { muted: boolean }) {
  return (
    <svg {...ICON} aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
      {muted && <path d="M4 3l16 18" />}
    </svg>
  );
}

function IconCamera({ off }: { off: boolean }) {
  return (
    <svg {...ICON} aria-hidden="true">
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="M15 10l6-4v12l-6-4z" />
      {off && <path d="M4 3l16 18" />}
    </svg>
  );
}

function IconScreen() {
  return (
    <svg {...ICON} aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16v4M12 12V8M10 10l2-2 2 2" />
    </svg>
  );
}

function IconLeave() {
  return (
    <svg {...ICON} aria-hidden="true">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8l-4 4 4 4M6 12h9" />
    </svg>
  );
}

export default function RoomStage({
  strings: t,
  remoteName,
  remoteInitials,
  transportConfigured,
}: {
  strings: RoomStageStrings;
  remoteName: string;
  remoteInitials: string;
  /** Server truth from videoTransportStatus() — never inferred on the client. */
  transportConfigured: boolean;
}) {
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [failure, setFailure] = useState<MediaFailure | null>(null);

  const camStream = useRef<MediaStream | null>(null);
  const shareStream = useRef<MediaStream | null>(null);
  const selfVideo = useRef<HTMLVideoElement | null>(null);
  const shareVideo = useRef<HTMLVideoElement | null>(null);

  const stopStream = (ref: React.RefObject<MediaStream | null>) => {
    ref.current?.getTracks().forEach(track => { track.stop(); });
    ref.current = null;
  };

  // Release every device on unmount — a camera left streaming after the
  // operator navigates away is a real privacy defect, not a cosmetic one.
  useEffect(() => {
    return () => {
      camStream.current?.getTracks().forEach(t2 => { t2.stop(); });
      shareStream.current?.getTracks().forEach(t2 => { t2.stop(); });
    };
  }, []);

  /** Ensure a camera/mic stream exists, requesting only what is missing. */
  const ensureUserStream = useCallback(async (wantVideo: boolean, wantAudio: boolean) => {
    const media = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!media?.getUserMedia) { setFailure("errUnsupported"); return null; }
    const existing = camStream.current;
    const hasVideo = !!existing?.getVideoTracks().length;
    const hasAudio = !!existing?.getAudioTracks().length;
    if (existing && (!wantVideo || hasVideo) && (!wantAudio || hasAudio)) return existing;
    try {
      const fresh = await media.getUserMedia({
        video: wantVideo && !hasVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: wantAudio && !hasAudio,
      });
      if (existing) {
        fresh.getTracks().forEach(track => { existing.addTrack(track); });
        return existing;
      }
      camStream.current = fresh;
      return fresh;
    } catch (err) {
      setFailure(classify(err));
      return null;
    }
  }, []);

  const toggleCamera = async () => {
    setFailure(null);
    if (camOn) {
      camStream.current?.getVideoTracks().forEach(track => { track.enabled = false; });
      setCamOn(false);
      return;
    }
    const stream = await ensureUserStream(true, false);
    if (!stream) return;
    stream.getVideoTracks().forEach(track => { track.enabled = true; });
    if (selfVideo.current) {
      selfVideo.current.srcObject = stream;
      selfVideo.current.play().catch(() => { /* autoplay policy — muted preview retries on click */ });
    }
    setCamOn(true);
  };

  const toggleMic = async () => {
    setFailure(null);
    if (micOn) {
      camStream.current?.getAudioTracks().forEach(track => { track.enabled = false; });
      setMicOn(false);
      return;
    }
    const stream = await ensureUserStream(false, true);
    if (!stream) return;
    stream.getAudioTracks().forEach(track => { track.enabled = true; });
    setMicOn(true);
  };

  const toggleShare = async () => {
    setFailure(null);
    if (sharing) {
      stopStream(shareStream);
      setSharing(false);
      return;
    }
    const media = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!media?.getDisplayMedia) { setFailure("errUnsupported"); return; }
    try {
      const stream = await media.getDisplayMedia({ video: true });
      shareStream.current = stream;
      // The browser's own "Stop sharing" control ends the track outside React;
      // mirror that back into state instead of showing a stale Sharing chip.
      stream.getVideoTracks().forEach(track => {
        track.addEventListener("ended", () => { shareStream.current = null; setSharing(false); });
      });
      if (shareVideo.current) {
        shareVideo.current.srcObject = stream;
        shareVideo.current.play().catch(() => { /* autoplay policy */ });
      }
      setSharing(true);
    } catch (err) {
      // A cancelled picker is a choice, not a failure.
      if ((err as { name?: string } | null)?.name !== "NotAllowedError") setFailure(classify(err));
    }
  };

  const leave = () => {
    stopStream(camStream);
    stopStream(shareStream);
    if (selfVideo.current) selfVideo.current.srcObject = null;
    if (shareVideo.current) shareVideo.current.srcObject = null;
    setCamOn(false); setMicOn(false); setSharing(false); setFailure(null);
  };

  const live = camOn || micOn || sharing;
  const stateText = transportConfigured
    ? (live ? t.stateConnected : t.statusReady)
    : (live ? t.stateLocalOnly : t.stateUnavailable);

  return (
    <section className="cd-stage" aria-label={t.title}>
      <div className="cd-stage__bar">
        <strong className="cd-stage__title">{t.title}</strong>
        <span className="cd-sub">{transportConfigured ? t.statusReady : t.statusNotReady}</span>
        <span className="cd-stage__spacer" />
        {sharing && <span className="sq-lozenge sq-lozenge--info">{t.sharingLabel}</span>}
        <span className={`sq-lozenge ${transportConfigured ? "sq-lozenge--info" : "sq-lozenge--virtual"}`}>{stateText}</span>
      </div>

      <div className="cd-stage__frame">
        {/* Remote leg — honest while the transport has no credentials. */}
        {sharing ? (
          <video ref={shareVideo} className="cd-stage__feed" muted playsInline aria-label={t.sharingLabel} />
        ) : (
          <div className="cd-stage__remote">
            <span className="cd-stage__avatar" aria-hidden="true">{remoteInitials}</span>
            <strong>{remoteName}</strong>
            <p className="cd-sub cd-stage__reason">
              {transportConfigured ? t.remoteWaiting : t.remoteUnavailable}
            </p>
            {!transportConfigured && <p className="cd-sub">{t.remoteUnavailableReason}</p>}
          </div>
        )}

        {/* Self-view — real local video whenever the camera is on. */}
        <div className="cd-stage__pip">
          <video
            ref={selfVideo}
            className="cd-stage__feed"
            muted
            playsInline
            aria-label={t.selfView}
            hidden={!camOn}
          />
          {!camOn && <span className="cd-sub">{t.cameraOff}</span>}
        </div>
      </div>

      <div className="cd-stage__controls">
        <button type="button" className="btn btn-secondary btn-touch cd-stage__btn"
          aria-pressed={micOn} onClick={toggleMic}>
          <IconMic muted={!micOn} />{micOn ? t.micOn : t.micOff}
        </button>
        <button type="button" className="btn btn-secondary btn-touch cd-stage__btn"
          aria-pressed={camOn} onClick={toggleCamera}>
          <IconCamera off={!camOn} />{camOn ? t.cameraOn : t.cameraOff}
        </button>
        <button type="button" className="btn btn-secondary btn-touch cd-stage__btn"
          aria-pressed={sharing} onClick={toggleShare}>
          <IconScreen />{sharing ? t.shareStop : t.share}
        </button>
        <span className="cd-stage__spacer" />
        {/* The control releases devices; it only "leaves a room" when a room
            can exist. Labelling it "Leave room" with no transport configured
            would assert a session that was never joined — the same failure the
            field route closed in 5fa170a7 (provider-unavailable is a failure,
            not a session). */}
        <button type="button" className="btn btn-danger btn-touch cd-stage__btn"
          onClick={leave} disabled={!live}>
          <IconLeave />{transportConfigured ? t.leave : t.stopDevices}
        </button>
      </div>

      {failure && (
        <div className="sq-banner sq-banner--warning" role="alert"><div>{t[failure]}</div></div>
      )}
      <p className="cd-sub cd-stage__note">{t.note}</p>
    </section>
  );
}
