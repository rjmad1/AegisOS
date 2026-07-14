// src/components/shell/VoiceFeedbackButton.tsx
// Floating Voice Feedback Button in React (Next.js) console app

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Trash2, Play, Pause, Send, MessageSquare, AlertTriangle, X, CheckCircle } from "lucide-react";

export function VoiceFeedbackButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [reportType, setReportType] = React.useState<"BUG" | "FEATURE" | "GENERAL">("GENERAL");
  
  // Recording states
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [recordingTime, setRecordingTime] = React.useState(0);
  
  // Playback states
  const [isPlaying, setIsPlaying] = React.useState(false);
  
  // Submit states
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [ticketId, setTicketId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Timer logic for recording duration
  React.useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioUrl(null);
      setTicketId(null);
      setErrorMsg(null);
    } catch (err: any) {
      console.error("Failed to start voice recording:", err);
      setErrorMsg("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setTicketId(null);
    setErrorMsg(null);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const submitFeedback = async () => {
    if (!audioBlob) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "feedback.wav");
      formData.append("reportType", reportType);
      formData.append("userEmail", "admin@ai-ops.local"); // Resolved from user session in real app
      formData.append("appVersion", "1.0.0");
      formData.append("devicePlatform", "web");

      const response = await fetch("/api/v1/feedback/voice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to upload feedback");
      }

      const result = await response.json();
      setTicketId(result.ticketId);
      resetRecordingStateOnly();
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Failed to send ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRecordingStateOnly = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-primary/20 hover:bg-primary/90"
        title="Record Voice Feedback"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-border/80 bg-card/95 glass-panel p-5 shadow-2xl text-card-foreground backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
              <span className="text-sm font-bold text-foreground">Submit Voice Feedback</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetRecording();
                }}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {ticketId ? (
              /* Success view */
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                <h3 className="font-extrabold text-foreground text-sm">Feedback Received!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Your ticket has been generated and alert emailed to lead architect.
                </p>
                <div className="mt-4 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs font-mono text-green-400">
                  {ticketId}
                </div>
                <button
                  onClick={() => setTicketId(null)}
                  className="mt-6 text-xs text-primary hover:underline"
                >
                  Submit another report
                </button>
              </div>
            ) : (
              /* Form / Recorder view */
              <div className="space-y-4">
                {/* Report Type Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Report Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["BUG", "FEATURE", "GENERAL"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setReportType(type)}
                        className={`rounded-lg py-1.5 text-[10px] font-extrabold border transition-all ${
                          reportType === type
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background/40 border-border/60 text-muted-foreground hover:bg-accent/40"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recorder Control Surface */}
                <div className="flex flex-col items-center justify-center p-6 bg-background/50 border border-border/40 rounded-xl">
                  {isRecording ? (
                    /* Recording State */
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-mono text-foreground">{formatTime(recordingTime)}</span>
                      </div>
                      <button
                        onClick={stopRecording}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Square className="h-5 w-5" />
                      </button>
                      <span className="text-[10px] text-muted-foreground font-semibold">TAPPING STOPS RECORDING</span>
                    </div>
                  ) : audioUrl ? (
                    /* Review State */
                    <div className="flex flex-col items-center gap-3 w-full">
                      <span className="text-xs text-foreground font-medium">Recording Captured</span>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={resetRecording}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          title="Delete Recording"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={togglePlayback}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/30 hover:scale-105 active:scale-95 transition-all"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </button>
                        <div className="w-8" /> {/* Spacer */}
                      </div>
                    </div>
                  ) : (
                    /* Idle State */
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={startRecording}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/30 hover:scale-105 hover:bg-primary/20 active:scale-95 transition-all"
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                      <span className="text-[10px] text-muted-foreground font-semibold">TAP TO RECORD FEEDBACK</span>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 text-red-500 text-[10px] bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  disabled={!audioBlob || isSubmitting}
                  onClick={submitFeedback}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-[0.99] disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Ticket Alert</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
