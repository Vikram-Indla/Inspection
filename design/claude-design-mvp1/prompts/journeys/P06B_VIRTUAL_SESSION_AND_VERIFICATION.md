# P06B — Virtual Session and Verification

Use the master constitution plus the virtual-video prompt. Cover SCR-VIR-700/710/720 and SB09. Inspect `apps/web/src/app/virtual`, OTP RPC behavior, participant states, and the video placeholder.

Design appointment, waiting room, device/network readiness, participant joining, role and identity context, OTP send/resend/cooldown/expiry/lockout, verification audit, begin-session guard, reschedule, close, and physical fallback.

The design must support the current provider-pending state without looking broken and a future adapter-ready state without claiming it exists. The factory representative must understand why verification is required and what data is captured. The inspector must see who joined, who is verified, retry limits, and why the session cannot begin.

Return desktop/tablet, Arabic/RTL, low-bandwidth, reconnect, participant absent, identity mismatch, provider unavailable, and insufficient-evidence fallback designs. Annotate the convergence into the common P07/P08 inspection engine.
