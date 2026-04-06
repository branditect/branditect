"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useBrand } from "@/lib/useBrand";

const typeOptions = ["Newsletter", "Social Posts", "Campaign Page", "Presentation", "Ad Copy", "Product Copy", "Proposal"];

const channelOptions = ["Email — Klaviyo", "Instagram", "Twitter / X", "LinkedIn", "Website"];
const toneOptions = ["Brand default", "More casual", "More formal", "Urgent", "Anti-corporate push"];
const formatOptions = ["HTML — ready to use", "Plain text", "Copy only"];
const checkOptions = ["Brand + Financial + Pulse", "Brand rules only", "No checks"];

const sampleOutputs: Record<string, string> = {
  Newsletter: `Subject: [Your subject line will appear here]

Hey [First Name],

[Your newsletter body copy will appear here, written in your brand's voice.]

[Call to action →]

---
✦ Brand check passed · Voice on-brand · No financial flags`,

  "Social Posts": `POST 1 — Instagram
[Your first Instagram caption will appear here.]
→ Link in bio

POST 2 — Instagram
[Your second Instagram caption will appear here.]

POST 3 — Twitter
[Your Twitter post will appear here.]

---
✦ Brand check passed · All posts on-voice · No financial flags`,
};

const genSteps = [
  "Loading brand context…",
  "Applying tone of voice…",
  "Checking Business Pulse…",
  "Checking financial rules…",
  "Finalising output…",
];

export default function CreatePage() {
  return (
    <Suspense>
      <CreatePageInner />
    </Suspense>
  );
}

function CreatePageInner() {
  const searchParams = useSearchParams();
  const { brandName } = useBrand();
  const [activeType, setActiveType] = useState("Newsletter");
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [output, setOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const briefParam = searchParams.get("brief");
    if (briefParam) setBrief(briefParam);
  }, [searchParams]);

  function generate() {
    if (generating) return;
    setGenerating(true);
    setOutput(null);
    setGenStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < genSteps.length) {
        setGenStep(step);
      } else {
        clearInterval(interval);
        setGenerating(false);
        const result = sampleOutputs[activeType] ||
          `Your ${brandName} ${activeType.toLowerCase()} is ready.\n\nChecked against:\n— Brand strategy & tone\n— Business Pulse\n— Financial rules\n\n✦ Copy or download above.`;
        setOutput(result);
      }
    }, 680);
  }

  function handleCopy() {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  }

  const outputLabel = generating
    ? `${activeType} — Generating…`
    : output
    ? `${activeType} — Ready`
    : "Output";

  return (
    <div className="flex flex-1 h-full overflow-hidden" style={{ display: "grid", gridTemplateColumns: "1fr 380px" }}>
      {/* Left — Editor */}
      <div className="border-r border-light flex flex-col overflow-hidden">
        <div className="px-7 pt-7 pb-4 border-b border-light shrink-0">
          <h1 className="font-display text-2xl text-ink tracking-tight mb-1">Create for {brandName}</h1>
          <p className="text-[0.78rem] text-muted">
            Every output is checked against {brandName}&apos;s strategy, tone, visual guidelines, and financial rules.
          </p>
        </div>

        {/* Type pills */}
        <div className="px-7 py-3.5 flex flex-wrap gap-1.5 border-b border-light shrink-0 bg-pale">
          {typeOptions.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3.5 py-[5px] rounded font-mono text-[0.62rem] tracking-wider uppercase border transition-all ${
                activeType === type
                  ? "bg-brand-orange text-white border-brand-orange font-medium"
                  : "bg-white text-muted border-light hover:border-muted hover:text-ink"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 px-7 py-6 overflow-y-auto">
          <label className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-muted block mb-1.5">
            Brief
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            placeholder={`What do you need? Branditect knows ${brandName}'s brand, strategy, and goals — just describe the specific ask.\n\ne.g. Write this month's newsletter. Topic: StreamerX partnership launch April 5. Goal: drive signups. Lead with the anti-corporate angle.`}
            className="w-full min-h-[96px] bg-pale border border-light rounded-md px-3.5 py-3 text-ink text-[0.84rem] font-light resize-none outline-none leading-relaxed focus:border-brand-orange focus:bg-white placeholder:text-muted mb-5 transition-colors"
          />

          <div className="grid grid-cols-2 gap-3.5 mb-5">
            <SelectField label="Channel" options={channelOptions} />
            <SelectField label="Tone Override" options={toneOptions} />
            <SelectField label="Output Format" options={formatOptions} />
            <SelectField label="Checks" options={checkOptions} />
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="w-full py-3.5 bg-brand-orange text-white rounded-md font-medium text-[0.86rem] hover:bg-brand-orange-hover transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            Generate with Branditect →
          </button>
        </div>
      </div>

      {/* Right — Output panel */}
      <div className="bg-pale flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-light bg-white flex items-center justify-between shrink-0">
          <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-muted">{outputLabel}</span>
          <div className="flex gap-[5px]">
            <button onClick={handleCopy} className="px-2.5 py-1 rounded font-mono text-[0.58rem] tracking-wider uppercase border border-light bg-white text-muted hover:border-brand-orange hover:text-brand-orange transition-all">
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button className="px-2.5 py-1 rounded font-mono text-[0.58rem] tracking-wider uppercase border border-light bg-white text-muted hover:border-brand-orange hover:text-brand-orange transition-all">
              Download
            </button>
            <button className="px-2.5 py-1 rounded font-mono text-[0.58rem] tracking-wider uppercase border border-light bg-white text-muted hover:border-brand-orange hover:text-brand-orange transition-all">
              Save
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {generating ? (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-brand-orange-pale border border-brand-orange-mid rounded-md font-mono text-[0.62rem] text-brand-orange tracking-wide">
              <span>✦</span>
              <span>{genSteps[genStep]}</span>
              <div className="flex gap-px ml-1">
                <span className="gen-dot" />
                <span className="gen-dot" />
                <span className="gen-dot" />
              </div>
            </div>
          ) : output ? (
            <div className="bg-white border border-light rounded-[7px] p-5 font-mono text-[0.78rem] font-light text-dark leading-[1.8] whitespace-pre-line tracking-wide">
              {output}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <div className="w-10 h-10 border border-light rounded-lg flex items-center justify-center text-[1.1rem] text-muted">
                ✦
              </div>
              <p className="text-[0.75rem] text-muted max-w-[180px] leading-relaxed">
                Your {brandName} output will appear here — on-brand, checked, ready to use.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-muted">{label}</label>
      <select className="px-2.5 py-2 bg-pale border border-light rounded-[5px] text-ink text-[0.8rem] font-light outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2710%27%20height%3D%276%27%3E%3Cpath%20d%3D%27M1%201l4%204%204-4%27%20stroke%3D%27%239A9A9A%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20fill%3D%27none%27/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_10px_center]">
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
