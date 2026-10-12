"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api, BlogPost } from "@/lib/api";
import Icon from "@/components/Icon";

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true);
        const data = await api.blog.getPublicBySlug(slug);
        setPost(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Article not found or not published: ${msg}`);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/blog"
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors"
          >
            <Icon name="arrow_back" /> All Articles
          </Link>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
            ISR Active: /blog/{slug}
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-medium animate-pulse">
            Loading article content...
          </div>
        ) : error || !post ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <h2 className="text-xl font-bold text-rose-400 mb-2">Article Unavailable</h2>
            <p className="text-slate-400 text-sm mb-6">{error || "Article could not be found."}</p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Back to Blog Hub
            </Link>
          </div>
        ) : (
          <article className="animate-fade-in">
            {/* Header / Meta */}
            <div className="mb-8 border-b border-slate-800 pb-8">
              <div className="flex items-center gap-3 text-xs text-slate-300 mb-4 font-mono">
                <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {post.status.toUpperCase()}
                </span>
                <span>•</span>
                <span>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Draft"}
                </span>
                <span>•</span>
                <span>By {post.author_name || "Mugogo Team"}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg text-slate-200 leading-relaxed font-light italic bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  "{post.excerpt}"
                </p>
              )}
            </div>

            {/* Content Body */}
            <div className="prose prose-invert max-w-none text-slate-100 leading-relaxed text-base space-y-6">
              {post.content_markdown || post.content_html || post.content ? (
                <div
                  className="whitespace-pre-wrap font-sans"
                  dangerouslySetInnerHTML={{
                    __html: post.content_html || post.content_markdown || post.content || "",
                  }}
                />
              ) : (
                <p className="text-slate-400 italic">No body content provided for this article.</p>
              )}
            </div>

            {/* Footer Attribution Badge */}
            <div className="mt-12 pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Published via Mugogo Growth OS</span>
              <span>Slug: {post.slug}</span>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
