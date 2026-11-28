import clickSoundUrl from "../sounds/click.mp3";

/**
 * Plays the wheel's tick sound through the Web Audio API.
 *
 * <audio> elements count as media playback: every play() can claim the OS audio focus /
 * "Now Playing" slot (pausing or ducking music in other apps) and open a new output stream
 * (audible glitches on some Windows and Bluetooth setups). Web Audio plays short sound
 * effects without either: one context, one output stream, a buffer decoded once.
 *
 * Timing: clicks can be scheduled slightly ahead on the audio clock so they are *heard* at the
 * moment the wheel crosses a slot border, compensating for the device's output latency and for
 * any quiet lead-in at the start of the sound file.
 */

const VOLUME = 0.5;
const MIN_GAP_SECONDS = 0.02; // never start two clicks closer than this

let context: AudioContext | null = null;
let gain: GainNode | null = null;
let buffer: AudioBuffer | null = null;
let onsetOffset = 0; // seconds of near-silence at the start of the file to skip
let lastStartTime = -Infinity;

/**
 * Where the click actually becomes audible in the file: the first sample reaching 30% of the
 * peak, backed off by 1 ms so the attack isn't cut.
 */
function findOnset(decoded: AudioBuffer): number {
    const samples = decoded.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
        peak = Math.max(peak, Math.abs(samples[i]));
    }
    if (peak === 0) return 0;

    const threshold = peak * 0.3;
    for (let i = 0; i < samples.length; i++) {
        if (Math.abs(samples[i]) >= threshold) {
            return Math.max(0, i / decoded.sampleRate - 0.001);
        }
    }
    return 0;
}

function ensureContext(): AudioContext {
    if (context) return context;

    // Safari 16.4+: ask the OS to mix this page's audio with other apps instead of interrupting them.
    const audioSession = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (audioSession) {
        audioSession.type = "ambient";
    }

    context = new AudioContext({ latencyHint: "interactive" });
    gain = context.createGain();
    gain.gain.value = VOLUME;
    gain.connect(context.destination);

    fetch(clickSoundUrl)
        .then((response) => response.arrayBuffer())
        .then((data) => context!.decodeAudioData(data))
        .then((decoded) => {
            onsetOffset = findOnset(decoded);
            buffer = decoded;
        })
        .catch((err) => console.error("Failed to load click sound:", err));

    return context;
}

/**
 * Call from a user gesture (the Spin click): browsers only allow audio to start after one.
 */
export function startClickSound() {
    const ctx = ensureContext();
    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }
}

/** Releases the audio output between spins so the page holds no audio stream while idle. */
export function stopClickSound() {
    if (context?.state === "running") {
        context.suspend().catch(() => {});
    }
}

/** Seconds between starting a sound and it leaving the speakers, as reported by the browser. */
export function getOutputLatency(): number {
    if (!context) return 0;
    return (context.outputLatency || 0) + (context.baseLatency || 0);
}

/**
 * Plays a click so that it is heard `inSeconds` from now (0 = as soon as possible).
 * The output latency is subtracted, so callers just pass the time of the visual event.
 */
export function playClick(playbackRate = 1, inSeconds = 0) {
    if (!context || !gain || !buffer || context.state !== "running") return;

    const when = Math.max(context.currentTime, context.currentTime + inSeconds - getOutputLatency());
    if (when - lastStartTime < MIN_GAP_SECONDS) return;
    lastStartTime = when;

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    source.connect(gain);
    source.start(when, onsetOffset);
}
