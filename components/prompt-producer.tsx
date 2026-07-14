"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, WandSparkles, X } from "lucide-react";

type MediaType = "song" | "album";
type Answers = Record<string, string>;

type Question = {
  id: string;
  eyebrow: string;
  question: string;
  placeholder: string;
  options?: string[];
  multiple?: boolean;
};

const sharedQuestions: Question[] = [
  {
    id: "genre",
    eyebrow: "Sound",
    question: "What genre should lead the release?",
    placeholder: "Or describe a genre blend...",
    options: ["Jazz", "Electronic", "R&B", "Hip-hop", "Rock", "Classical", "Ambient", "Pop"]
  },
  {
    id: "mood",
    eyebrow: "Feeling",
    question: "What should the listener feel?",
    placeholder: "Describe the emotional atmosphere...",
    options: ["Intimate", "Euphoric", "Melancholic", "Dark", "Hopeful", "Dreamlike", "Tense", "Playful"]
  },
  {
    id: "instruments",
    eyebrow: "Palette",
    question: "Which sounds should lead?",
    placeholder: "Add instruments, textures, or sounds...",
    multiple: true,
    options: ["Piano", "Guitar", "Synths", "Strings", "Saxophone", "Bass", "Live drums", "Drum machine"]
  },
  {
    id: "vocals",
    eyebrow: "Voice",
    question: "How should vocals be used?",
    placeholder: "Describe another vocal direction...",
    options: ["Instrumental", "Lead vocal", "Duet", "Choir", "Spoken word", "Vocal textures"]
  },
  {
    id: "direction",
    eyebrow: "Direction",
    question: "What should define the final feel?",
    placeholder: "Add tempo, structure, production notes, context, or anything to avoid...",
    multiple: true,
    options: ["Slow burn", "Upbeat", "Immediate hook", "Gradual build", "Warm analog", "Modern polished", "Cinematic", "YouTube-ready"]
  }
];

function releaseQuestion(mediaType: MediaType): Question {
  return mediaType === "song"
    ? {
        id: "scope",
        eyebrow: "Length",
        question: "How long should the song be?",
        placeholder: "Enter an exact duration or another direction...",
        options: ["Under 2 minutes", "2-3 minutes", "3-4 minutes", "4-6 minutes", "Extended"]
      }
    : {
        id: "scope",
        eyebrow: "Scale",
        question: "How large should the album be?",
        placeholder: "Enter a track count or total runtime...",
        options: ["4 tracks", "6 tracks", "8 tracks", "10 tracks", "30 minutes", "45-60 minutes"]
      };
}

export function PromptProducer({
  open,
  mediaType,
  onClose,
  onComplete
}: {
  open: boolean;
  mediaType: MediaType;
  onClose: () => void;
  onComplete: (prompt: string, source: "ai" | "structured") => void;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [customAnswer, setCustomAnswer] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [error, setError] = useState("");

  const questions = useMemo(() => {
    return [...sharedQuestions.slice(0, 4), releaseQuestion(mediaType), ...sharedQuestions.slice(4)];
  }, [mediaType]);

  const safeStep = Math.min(step, questions.length - 1);
  const current = questions[safeStep];
  const selected = answers[current.id] ?? "";
  const selectedValues = selected.split(", ").filter(Boolean);
  const isLast = safeStep === questions.length - 1;

  function selectOption(option: string) {
    setError("");
    if (current.multiple) {
      const values = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option];
      setAnswers((existing) => ({ ...existing, [current.id]: values.join(", ") }));
      return;
    }
    setAnswers((existing) => ({ ...existing, [current.id]: option }));
  }

  function commitCustomAnswer() {
    const value = customAnswer.trim();
    if (!value) return;
    setAnswers((existing) => ({
      ...existing,
      [current.id]: current.multiple && existing[current.id] ? `${existing[current.id]}, ${value}` : value
    }));
    setCustomAnswer("");
  }

  function moveNext() {
    commitCustomAnswer();
    setStep((value) => Math.min(value + 1, questions.length - 1));
    setCustomAnswer("");
  }

  function moveBack() {
    setStep((value) => Math.max(value - 1, 0));
    setCustomAnswer("");
    setError("");
  }

  async function composePrompt() {
    const finalAnswers = { ...answers };
    if (customAnswer.trim()) {
      finalAnswers[current.id] = current.multiple && finalAnswers[current.id]
        ? `${finalAnswers[current.id]}, ${customAnswer.trim()}`
        : customAnswer.trim();
    }

    setIsComposing(true);
    setError("");
    try {
      const response = await fetch("/api/prompts/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType, answers: finalAnswers })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Prompt creation failed.");
      onComplete(data.prompt, data.source === "ai" ? "ai" : "structured");
      setAnswers(finalAnswers);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Prompt creation failed.");
    } finally {
      setIsComposing(false);
    }
  }

  if (!open) return null;

  return (
          <motion.aside
            aria-labelledby="prompt-producer-title"
            className="prompt-producer-dialog flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--border-active)] bg-[rgba(226,102,174,.1)] text-[var(--rose-soft)]">
                  <WandSparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 id="prompt-producer-title" className="text-sm font-semibold text-white">Prompt Producer</h2>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{mediaType === "song" ? "Song direction" : "Album direction"}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-muted)] transition hover:bg-white/[.06] hover:text-white" aria-label="Close prompt producer" title="Close">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="h-1 bg-white/[.035]">
              <motion.div className="h-full bg-[linear-gradient(90deg,var(--violet),var(--rose))]" animate={{ width: `${((safeStep + 1) / questions.length) * 100}%` }} />
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-4 py-5">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--rose-soft)]">
                <span>{current.eyebrow}</span>
                <span className="text-[var(--text-muted)]">{String(safeStep + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={current.id} className="mt-4 flex min-h-0 flex-1 flex-col" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>
                  <h3 className="text-xl font-semibold leading-tight text-white">{current.question}</h3>
                  {current.options ? (
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      {current.options.map((option) => {
                        const active = selectedValues.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => selectOption(option)}
                            aria-pressed={active}
                            className={`flex min-h-11 items-center justify-between rounded-lg border px-3 text-left text-xs transition ${active ? "border-[var(--border-active)] bg-[rgba(226,102,174,.12)] text-white" : "border-[var(--border)] bg-white/[.035] text-[var(--text-secondary)] hover:border-white/[.16] hover:bg-white/[.06]"}`}
                          >
                            <span>{option}</span>
                            {active ? <Check className="h-3.5 w-3.5 shrink-0 text-[var(--rose-soft)]" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  <div className="mt-4 flex gap-2">
                    <input
                      value={customAnswer}
                      onChange={(event) => setCustomAnswer(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !isLast) moveNext();
                      }}
                      className="glass-control h-11 min-w-0 flex-1 rounded-lg px-3 text-sm text-white outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)]"
                      placeholder={current.placeholder}
                      aria-label={`Answer: ${current.question}`}
                      autoFocus
                    />
                    {current.multiple && customAnswer.trim() ? (
                      <button type="button" onClick={commitCustomAnswer} className="h-11 rounded-lg border border-[var(--border)] bg-white/[.05] px-4 text-xs text-white hover:bg-white/[.08]">Add</button>
                    ) : null}
                  </div>
                  {selected ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">Selected: <span className="text-[var(--text-secondary)]">{selected}</span></p> : null}
                  {error ? <p className="mt-3 text-xs text-[var(--danger)]">{error}</p> : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-4">
              <button type="button" onClick={moveBack} disabled={safeStep === 0 || isComposing} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] transition hover:bg-white/[.05] hover:text-white disabled:invisible">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex items-center gap-2">
                {!isLast ? (
                  <button type="button" onClick={moveNext} className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[.05] px-4 text-sm text-white transition hover:bg-white/[.08]">
                    {selected || customAnswer.trim() ? "Next" : "Skip"} <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="button" onClick={composePrompt} disabled={isComposing} className="glass-primary flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium disabled:opacity-50">
                    {isComposing ? <Sparkles className="h-4 w-4 animate-pulse" /> : <WandSparkles className="h-4 w-4" />}
                    {isComposing ? "Producing..." : "Create Prompt"}
                  </button>
                )}
              </div>
            </footer>
          </motion.aside>
  );
}
