"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { api, BlogPost } from "@/lib/api";

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form states for generating/ingesting a new draft post
  const [newTitle, setNewTitle] = useState("");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAuthor, setNewAuthor] = useState("Mugogo Content Engine");
  const [serviceToken, setServiceToken] = useState("mugogo-blog-internal-secret-token");
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.blog.listPublic(1, 50);
      setPosts(res.posts);
      setError(null);
    } catch {
      setError("Cannot reach the Mugogo Engine API. Check the backend service and network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleIngestDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.blog.createOrUpdateInternal(
        {
          title: newTitle,
          excerpt: newExcerpt,
          content: newContent,
          author_name: newAuthor,
          status: "draft", // Defaults to draft requiring human approval
        },
        serviceToken
      );

      setActionSuccess(`Draft ingested successfully! Slug: "${res.slug}" (Status: DRAFT)`);
      setNewTitle("");
      setNewExcerpt("");
      setNewContent("");
      fetchPosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Ingestion failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAndPublish = async (postIdOrSlug: string, title: string) => {
    try {
      setError(null);
      const res = await api.blog.approveAndPublish(postIdOrSlug, serviceToken);
      setActionSuccess(`Approved & Published "${title}"! ISR Cache revalidated for /blog/${res.slug}`);
      fetchPosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Publish failed: ${msg}`);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                Subdirectory Blog & Human Approval Workspace
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Review AI content engine drafts, approve articles, and trigger Next.js on-demand revalidation.
              </p>
            </div>
            <a
              href="/blog"
              target="_blank"
              className="btn btn-secondary flex items-center gap-2 text-xs"
            >
              <Icon name="launch" /> View Live Blog Hub
            </a>
          </div>
          <div className="accent-line mt-4" />
        </div>

        {/* Action Notifications */}
        {actionSuccess && (
          <div className="card mb-6 animate-fade-in border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Icon name="check_circle" /> {actionSuccess}
              </span>
              <button onClick={() => setActionSuccess(null)} className="text-xs opacity-80 hover:opacity-100">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="card mb-6 animate-fade-in border-rose-500/30 bg-rose-500/10 text-rose-300">
            <p className="text-sm flex items-center gap-2">
              <Icon name="warning" /> {error}
            </p>
          </div>
        )}

        {/* Content Pipeline Ingestion Form */}
        <div className="card mb-8 animate-slide-up">
          <h2 className="font-semibold mb-4 text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <Icon name="auto_awesome" /> SIMULATE CONTENT ENGINE INGESTION
          </h2>
          <form onSubmit={handleIngestDraft} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                  Article Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 Tax Strategies for Kenyan Businesses in 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                  Author Name
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                Article Excerpt
              </label>
              <input
                type="text"
                placeholder="Short summary for SEO meta description..."
                value={newExcerpt}
                onChange={(e) => setNewExcerpt(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
                Markdown / Body Content
              </label>
              <textarea
                rows={4}
                placeholder="# Introduction&#10;Write markdown article content here..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                Rule: Enforces Draft status (Requires Human Approval)
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-2"
              >
                <Icon name="post_add" /> {submitting ? "Ingesting..." : "Ingest Draft Article"}
              </button>
            </div>
          </form>
        </div>

        {/* Published & Active Posts Table */}
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
              PUBLISHED ARTICLES & REVALIDATION LOG
            </h2>
            <button
              onClick={fetchPosts}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Icon name="refresh" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">Loading articles...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No published articles found in database. Ingest a draft above and click "Approve & Publish"!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="pb-3 font-medium">Title & Slug</th>
                    <th className="pb-3 font-medium">Author</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Published At</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-900/50">
                      <td className="py-3 pr-4">
                        <div className="font-bold text-slate-100">{post.title}</div>
                        <div className="font-mono text-slate-500 text-2xs">/blog/{post.slug}</div>
                      </td>
                      <td className="py-3 pr-4">{post.author_name || "Mugogo Team"}</td>
                      <td className="py-3 pr-4">
                        <span className="badge badge-express uppercase font-mono">
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-slate-400">
                        {post.published_at ? new Date(post.published_at).toLocaleString() : "Pending"}
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-emerald-400 hover:underline flex items-center justify-end gap-1 font-medium"
                        >
                          View Live <Icon name="open_in_new" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
