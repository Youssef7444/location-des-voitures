import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatAdminThreadTime,
  getAdminInitials,
  getAdminThreadDisplayName,
  readAdminSupportThreads,
} from "../utils/adminHelpers";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-support-future-icon" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16 20 20" />
    </svg>
  );
}

function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-support-future-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 10h.01M15 10h.01M8.5 14.25c.9 1.1 2.1 1.65 3.5 1.65s2.6-.55 3.5-1.65" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-support-future-icon" aria-hidden="true">
      <path d="M8.75 12.5 14.9 6.35a3 3 0 1 1 4.25 4.25l-7.78 7.78a4.5 4.5 0 0 1-6.36-6.36l7.42-7.42" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="admin-support-future-icon" aria-hidden="true">
      <path d="m4 11.75 14.75-6.25-3.4 12.75-4.2-4.1L4 11.75Z" />
      <path d="M11.15 14.15 18.75 5.5" />
    </svg>
  );
}

export default function AdminSupportPage() {
  const [threads, setThreads] = useState(() => readAdminSupportThreads());
  const [tab, setTab] = useState("client");
  const [selectedKey, setSelectedKey] = useState(() => readAdminSupportThreads()[0]?.key || null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const messagesRef = useRef(null);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      if (thread.role !== tab) return false;
      const displayName = getAdminThreadDisplayName(thread).toLowerCase();
      const lastText = String(thread.messages.at(-1)?.text || "").toLowerCase();
      const term = search.toLowerCase();
      return displayName.includes(term) || lastText.includes(term);
    });
  }, [search, tab, threads]);

  const selectedThread =
    filteredThreads.find((item) => item.key === selectedKey) ||
    filteredThreads[0] ||
    null;

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [selectedThread?.key, selectedThread?.messages.length]);

  function sendReply() {
    if (!selectedThread || !draft.trim()) return;

    const nextThreads = threads.map((thread) => {
      if (thread.key !== selectedThread.key) return thread;

      const nextMessages = [
        ...thread.messages,
        {
          id: Date.now(),
          role: "admin",
          text: draft.trim(),
          createdAt: new Date().toISOString(),
          author: "Support administration",
        },
      ];

      window.localStorage.setItem(thread.key, JSON.stringify(nextMessages));
      return { ...thread, messages: nextMessages };
    });

    setThreads(nextThreads);
    setDraft("");
  }

  return (
    <div className="admin-support-future-page">
      <div className="admin-support-future-aurora" aria-hidden="true">
        <span className="admin-support-future-particle particle-a" />
        <span className="admin-support-future-particle particle-b" />
        <span className="admin-support-future-particle particle-c" />
      </div>

      <section className="admin-support-future-shell">
        <aside className="admin-support-future-sidebar">
          <div className="admin-support-future-sidebar-head">
            <div>
              <h2>Messages</h2>
              <p>{filteredThreads.length} live conversations</p>
            </div>

            <div className="admin-support-future-tabs">
              <button type="button" className={tab === "client" ? "is-active" : ""} onClick={() => setTab("client")}>
                Clients
              </button>
              <button type="button" className={tab === "company" ? "is-active" : ""} onClick={() => setTab("company")}>
                Companies
              </button>
            </div>
          </div>

          <label className="admin-support-future-search">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversation..."
            />
          </label>

          <div className="admin-support-future-thread-list">
            {filteredThreads.map((thread, index) => {
              const lastMessage = thread.messages.at(-1);
              const displayName = getAdminThreadDisplayName(thread);
              const unreadCount = Math.max(1, thread.messages.filter((message) => message.role !== "admin").length % 3);

              return (
                <button
                  key={thread.key}
                  type="button"
                  className={`admin-support-future-thread ${selectedThread?.key === thread.key ? "is-active" : ""}`}
                  onClick={() => setSelectedKey(thread.key)}
                >
                  <div className="admin-support-future-thread-avatar">
                    <span>{getAdminInitials(displayName)}</span>
                    <i className="admin-support-future-thread-online" />
                  </div>

                  <div className="admin-support-future-thread-copy">
                    <div className="admin-support-future-thread-head">
                      <strong>{displayName}</strong>
                      <time>{formatAdminThreadTime(lastMessage?.createdAt)}</time>
                    </div>
                    <p>{lastMessage?.text || "No message yet."}</p>
                  </div>

                  <span className="admin-support-future-unread" style={{ animationDelay: `${index * 80}ms` }}>
                    {unreadCount}
                  </span>
                </button>
              );
            })}

            {!filteredThreads.length ? (
              <div className="admin-support-future-empty">No conversations available in this segment.</div>
            ) : null}
          </div>
        </aside>

        <section className="admin-support-future-chat">
          {selectedThread ? (
            <>
              <header className="admin-support-future-chat-head">
                <div className="admin-support-future-chat-profile">
                  <div className="admin-support-future-chat-avatar">
                    {getAdminInitials(getAdminThreadDisplayName(selectedThread))}
                  </div>
                  <div>
                    <strong>{getAdminThreadDisplayName(selectedThread)}</strong>
                    <div className="admin-support-future-chat-meta">
                      <span className={`admin-support-future-role ${selectedThread.role}`}>
                        {selectedThread.role === "company" ? "Company" : "Client"}
                      </span>
                      <span className="admin-support-future-status">online now</span>
                    </div>
                  </div>
                </div>

                <button type="button" className="admin-support-future-profile-btn">
                  View Profile
                </button>
              </header>

              <div className="admin-support-future-messages" ref={messagesRef}>
                {selectedThread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`admin-support-future-row ${
                      message.role === "admin" ? "is-admin" : "is-user"
                    }`}
                  >
                    <article
                      className={`admin-support-future-bubble ${
                        message.role === "admin" ? "is-admin" : "is-user"
                      }`}
                    >
                      <div className="admin-support-future-bubble-meta">
                        <strong>
                          {message.role === "admin"
                            ? "Administration"
                            : message.role === "bot"
                              ? "Assistant"
                              : message.author || "User"}
                        </strong>
                        <time>{formatAdminThreadTime(message.createdAt)}</time>
                      </div>
                      <p>{message.text}</p>
                    </article>
                  </div>
                ))}

                <div className="admin-support-future-typing">
                  <span className="admin-support-future-typing-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>typing...</span>
                </div>
              </div>

              <div className="admin-support-future-composer">
                <button type="button" className="admin-support-future-tool" aria-label="Emoji">
                  <EmojiIcon />
                </button>
                <button type="button" className="admin-support-future-tool" aria-label="Attach file">
                  <AttachIcon />
                </button>
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Write a premium support response..."
                />
                <button type="button" className="admin-support-future-send" onClick={sendReply}>
                  <SendIcon />
                </button>
              </div>
            </>
          ) : (
            <div className="admin-support-future-empty">
              Choose a conversation to open the futuristic support workspace.
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
