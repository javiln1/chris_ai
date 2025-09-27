"use client";

import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("json", json);

// Hidden sources comment parser
const SOURCES_RE = /<!--\s*SOURCES_DATA:\s*(\{[\s\S]*?\})\s*-->/m;
function stripSourcesComment(text: string) {
  return text.replace(SOURCES_RE, "").trim();
}
function parseSources(text: string): any[] | null {
  const m = text.match(SOURCES_RE);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]);
    return obj.sources || null;
  } catch {
    return null;
  }
}

// Callouts: **Time investment:** X
const CALLOUTS = [
  { key: "Time investment", icon: "⏱️" },
  { key: "Expected result", icon: "🎯" },
  { key: "Pro Tip", icon: "💡" },
  { key: "Warning", icon: "⚠️" },
  { key: "Note", icon: "📝" },
];
function detectCallout(text: string) {
  const m = text.match(/^\*\*(.+?)\*\*:\s*(.*)$/);
  if (!m) return null;
  const label = m[1].trim();
  const body = m[2].trim();
  const found = CALLOUTS.find(c =>
    label.toLowerCase().startsWith(c.key.toLowerCase())
  );
  return found ? { ...found, label, body } : null;
}

export default function FormattedMessage({
  role,
  content,
}: {
  role: "user" | "assistant" | "system";
  content: string;
}) {
  console.log("[FormattedMessage] rendering with markdown for role:", role);
  const [copied, setCopied] = useState(false);
  const sources = useMemo(() => parseSources(content), [content]);
  const clean = useMemo(() => stripSourcesComment(content), [content]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {}
  }

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`group relative rounded-2xl p-6
                     ${role === 'user'
                       ? 'max-w-2xl bg-green-500/10 border border-green-400/20 text-zinc-100'
                       : 'max-w-4xl bg-zinc-900/70 text-zinc-100'}
                     shadow-md shadow-black/20 hover:shadow-lg hover:shadow-black/30
                     transition-shadow duration-200`}
      >
      {/* Copy */}
      {/* Copy button container */}
      <div className="absolute right-3 top-3">
        <button
          onClick={onCopy}
          aria-label="Copy message"
          title="Copy"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md
                     bg-zinc-800/70 backdrop-blur-sm
                     opacity-0 group-hover:opacity-100 focus:opacity-100
                     hover:bg-zinc-800 transition-opacity duration-150"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M7 4.5h6M8 3h4a1 1 0 0 1 1 1v.5h1.5A1.5 1.5 0 0 1 16 6v9A1.5 1.5 0 0 1 14.5 16h-9A1.5 1.5 0 0 1 4 14.5v-9A1.5 1.5 0 0 1 5.5 4.5H7V4a1 1 0 0 1 1-1Z"
                  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* Floating tooltip */}
        {copied && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute -right-1 bottom-9 select-none
                       rounded-md px-2 py-0.5 text-[11px] font-medium
                       text-zinc-100 bg-zinc-800/90
                       shadow-[0_8px_20px_-10px_rgba(0,0,0,0.8)]
                       animate-float-fade"
          >
            Copied ✓
          </div>
        )}
      </div>


      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-100 mb-6 mt-8">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100 mt-8 mb-4">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-zinc-200 mt-6 mb-3">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-zinc-200 mt-4 mb-2">
              {children}
            </h4>
          ),
          strong: ({ children }) => (
            <strong className="text-zinc-100 font-semibold">{children}</strong>
          ),
                p: ({ children }) => {
                  const raw =
                    typeof children?.[0] === "string"
                      ? (children[0] as string)
                      : undefined;
                  const call = raw ? detectCallout(raw) : null;
                  if (call) {
                    return (
                      <div className="my-4 rounded-lg border border-zinc-700 bg-zinc-800/40 px-4 py-3">
                        <div className="text-sm font-medium text-zinc-100">
                          <span className="mr-1">{call.icon}</span>
                          {call.label}
                        </div>
                        <div className="text-sm text-zinc-300 leading-7 mt-1">
                          {call.body}
                        </div>
                      </div>
                    );
                  }
                  return <p className="leading-8 text-zinc-200 mb-4 text-base">{children}</p>;
                },
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-2 mb-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-2 mb-6">{children}</ol>
          ),
          li: ({ children }) => <li className="text-zinc-200 leading-7 text-base">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:no-underline text-zinc-100"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-8 border-zinc-800" />,
          code({ inline, className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <pre className="overflow-auto rounded-xl bg-zinc-900 p-3 text-zinc-100 text-sm my-3">
                {String(children).replace(/\n$/, "")}
              </pre>
            ) : (
              <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-100">
                {children}
              </code>
            );
          },
        }}
      >
        {clean}
      </ReactMarkdown>

      {Array.isArray(sources) && sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-800/60">
          <div className="text-sm font-medium text-zinc-300 mb-2">
            📚 Sources from the Knowledge Base
          </div>
          <ol className="list-decimal pl-6 space-y-2">
            {sources.map((s: any, i: number) => {
              const score = Math.round(
                Number(s.relevance ?? s.score ?? 0) * 100
              );
              return (
                <li key={i} className="text-sm text-zinc-300">
                  <div className="font-medium text-zinc-100">
                    {s.title || s.id || "Untitled"}
                  </div>
                  <div className="text-zinc-400">
                    Relevance: {isNaN(score) ? "—" : `${score}%`}
                    {s.creator ? ` • Creator: ${s.creator}` : ""}
                  </div>
                  {s.hasVideo && s.videoUrl && (
                    <a
                      className="text-zinc-100 underline"
                      href={s.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Watch video
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
      </div>
    </div>
  );
}