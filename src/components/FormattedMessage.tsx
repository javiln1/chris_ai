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
    <div
      className={`group relative w-full rounded-2xl border p-4 sm:p-5 bg-zinc-900/60 border-zinc-800`}
    >
      {/* Copy */}
      <button
        onClick={onCopy}
        className="absolute right-3 top-3 text-xs px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200"
      >
        {copied ? "Copied" : "Copy"}
      </button>

      {/* TEMP sanity header: should render as a large H2 if this component is active */}
      {role === "assistant" && (
        <div className="mb-2 text-xs text-zinc-500">## TEST SHOULD BE A BIG H2</div>
      )}

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100 mt-3 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-zinc-200 mt-3 mb-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-zinc-200 mt-2 mb-1">
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
                <div className="my-3 rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2">
                  <div className="text-sm font-medium text-zinc-100">
                    <span className="mr-1">{call.icon}</span>
                    {call.label}
                  </div>
                  <div className="text-sm text-zinc-300 leading-6 mt-1">
                    {call.body}
                  </div>
                </div>
              );
            }
            return <p className="leading-7 text-zinc-200 mb-3">{children}</p>;
          },
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-1.5 mb-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-1.5 mb-4">{children}</ol>
          ),
          li: ({ children }) => <li className="text-zinc-200">{children}</li>,
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
          hr: () => <hr className="my-4 border-zinc-800" />,
          code({ inline, className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                style={atomOneDark}
                language={match[1]}
                PreTag="div"
                customStyle={{ borderRadius: 14, marginTop: 8, marginBottom: 12 }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
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
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
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
  );
}