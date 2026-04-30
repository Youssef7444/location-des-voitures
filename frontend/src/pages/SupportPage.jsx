import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FAQ_OPTIONS = [
  {
    id: "price",
    label: "Price",
    keywords: ["price", "prix", "cost", "tarif", "rate"],
    answer:
      "Our rental prices depend on the vehicle category, rental duration and the company rules. Open the car page or your reservation card to review the current total and the included details.",
  },
  {
    id: "availability",
    label: "Availability",
    keywords: ["availability", "available", "disponible", "disponibilite"],
    answer:
      "Vehicle availability updates automatically from the company fleet. If a car is marked available, you can request it immediately. For a faster answer on a specific car, send us the reservation number or vehicle name.",
  },
  {
    id: "cancellation",
    label: "Cancellation",
    keywords: ["cancel", "cancellation", "annulation", "refund", "remboursement"],
    answer:
      "You can cancel an eligible reservation from My Reservations by adding a cancellation reason. If the rental company needs to review a special case, ask for a team member and we will follow up manually.",
  },
  {
    id: "documents",
    label: "Required Documents",
    keywords: ["document", "documents", "license", "passport", "piece", "permis"],
    answer:
      "Most companies ask for a valid driving license, an identity document, and sometimes a payment guarantee at pickup. The exact list can vary, so your company can confirm the final checklist in the conversation.",
  },
  {
    id: "booking",
    label: "Booking Status",
    keywords: ["status", "booking", "reservation", "pending", "approved", "confirmed"],
    answer:
      "You can follow every reservation from My Reservations. Pending means the company still needs to reply, Approved means the booking was accepted, and Cancelled or Rejected will appear there as soon as the status changes.",
  },
  {
    id: "human",
    label: "Talk to a Team Member",
    keywords: ["human", "agent", "member", "support", "advisor", "assistance"],
    answer:
      "I have forwarded your request to the SpeedRent assistance team. A team member will join this conversation as soon as possible.",
    handoff: true,
  },
];

function normalizeMessages(input) {
  return (Array.isArray(input) ? input : []).map((message, index) => ({
    id: message?.id ?? `${Date.now()}-${index}`,
    role: String(message?.role || "user"),
    text: String(message?.text || ""),
    author: message?.author || "",
    createdAt: message?.createdAt || message?.created_at || new Date().toISOString(),
    meta: typeof message?.meta === "object" && message.meta ? message.meta : {},
  }));
}

function loadSupportMessages(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return normalizeMessages(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function makeMessage({ role, text, author, meta = {}, offset = 0 }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    author,
    meta,
    createdAt: new Date(Date.now() + offset).toISOString(),
  };
}

function getAssistantReply(text) {
  const clean = String(text || "").trim().toLowerCase();
  if (!clean) return FAQ_OPTIONS[0];

  const matched =
    FAQ_OPTIONS.find((entry) => entry.keywords.some((keyword) => clean.includes(keyword))) ||
    null;

  if (matched) return matched;

  return {
    id: "fallback",
    label: "General Help",
    answer:
      "I can answer common questions about prices, availability, cancellations, required documents and booking status. If your request needs a manual review, choose Talk to a Team Member and our support staff will continue the conversation.",
  };
}

function SupportBotIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8.5A2.5 2.5 0 0 1 8.5 6h7A2.5 2.5 0 0 1 18 8.5v5A2.5 2.5 0 0 1 15.5 16H12l-3.7 3V16H8.5A2.5 2.5 0 0 1 6 13.5Z" />
      <path d="M9.25 10.25h.01M12 10.25h.01M14.75 10.25h.01" />
    </svg>
  );
}

export default function SupportPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [isEscalated, setIsEscalated] = useState(false);
  const messagesRef = useRef(null);

  const storageKey = useMemo(
    () => `support-thread:${user?.id || "guest"}:${user?.role || "client"}`,
    [user?.id, user?.role]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const existing = loadSupportMessages(storageKey);

    if (existing.length) {
      setMessages(existing);
      setIsEscalated(existing.some((message) => message?.meta?.handoff));
      return;
    }

    const welcomeMessages = [
      makeMessage({
        role: "bot",
        author: "Assistant SpeedRent",
        text: "Hello, I am the SpeedRent virtual assistant. I can answer the most common questions before a team member joins the conversation.",
      }),
      makeMessage({
        role: "bot",
        author: "Assistant SpeedRent",
        text: "Choose a suggested topic below or write your question. If needed, I can also escalate your request to our support team.",
        offset: 350,
      }),
    ];

    setMessages(welcomeMessages);
    setIsEscalated(false);
    localStorage.setItem(storageKey, JSON.stringify(welcomeMessages));
  }, [isAuthenticated, storageKey]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  if (!authLoading && !isAuthenticated) {
    return <Navigate replace to="/auth?mode=signin&next=%2Fsupport" />;
  }

  function persist(nextMessages) {
    setMessages(nextMessages);
    localStorage.setItem(storageKey, JSON.stringify(nextMessages));
  }

  function pushBotReply(option, userText = "") {
    const nextMessages = [
      ...messages,
      userText
        ? makeMessage({
            role: "user",
            text: userText,
            author: user?.name || "You",
          })
        : null,
      makeMessage({
        role: "bot",
        text: option.answer,
        author: "Assistant SpeedRent",
        meta: option.handoff ? { handoff: true } : {},
        offset: 300,
      }),
    ].filter(Boolean);

    if (option.handoff) {
      nextMessages.push(
        makeMessage({
          role: "admin",
          text: "Support handoff requested. A SpeedRent team member will review this conversation and reply here.",
          author: "SpeedRent Support Queue",
          meta: { handoff: true, waitingForHuman: true },
          offset: 700,
        })
      );
      setIsEscalated(true);
      window.dispatchEvent(new CustomEvent("app-toast", { detail: "Support team notified." }));
    }

    persist(nextMessages);
  }

  function handleFaqClick(option) {
    pushBotReply(option, option.label);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const botOption = getAssistantReply(text);
    pushBotReply(botOption, text);
    setDraft("");
  }

  return (
    <section className="section support-page">
      <div className="content-wrap">
        <div className="support-showcase">
          <div className="support-showcase-head">
            <div className="support-branding">
              <span className="support-brand-badge">
                <SupportBotIcon />
              </span>
              <div>
                <p className="support-kicker">Smart Assistance</p>
                <h1>Assistance Center</h1>
              </div>
            </div>
            <div className="support-head-copy">
              <p>Start with quick automated answers for the most common questions, then hand the conversation to a real SpeedRent team member when needed.</p>
              <span className={`support-status-pill ${isEscalated ? "live" : ""}`}>
                {isEscalated ? "Team member will reply soon" : "AI assistant available now"}
              </span>
            </div>
          </div>

          <div className="support-layout">
            <aside className="support-sidebar">
              <div className="support-sidebar-card">
                <p className="support-sidebar-title">Popular Questions</p>
                <div className="support-faq-grid">
                  {FAQ_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`support-faq-chip ${option.handoff ? "support-faq-chip-accent" : ""}`}
                      onClick={() => handleFaqClick(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="support-sidebar-card support-sidebar-note">
                <strong>How it works</strong>
                <p>The assistant answers common questions instantly. If your case needs manual review, choose Talk to a Team Member and the conversation will stay available for our staff.</p>
              </div>
            </aside>

            <div className="support-chat-card">
              <div className="support-chat-topbar">
                <div className="support-chat-profile">
                  <span className="support-chat-avatar">
                    <SupportBotIcon />
                  </span>
                  <div>
                    <strong>Assistant SpeedRent</strong>
                    <span>{isEscalated ? "Conversation escalated to support team" : "AI conversation in progress"}</span>
                  </div>
                </div>
              </div>

              <div className="support-thread-modern" ref={messagesRef}>
                {messages.length ? (
                  messages.map((message) => (
                    <article
                      key={message.id}
                      className={`support-message-bubble ${message.role === "user" ? "user" : message.role === "admin" ? "admin" : "bot"}`}
                    >
                      <strong>
                        {message.author ||
                          (message.role === "user"
                            ? user?.name || "You"
                            : message.role === "admin"
                              ? "Support Team"
                              : "Assistant SpeedRent")}
                      </strong>
                      <p>{message.text}</p>
                    </article>
                  ))
                ) : (
                  <div className="support-empty-card">
                    Your support conversation will appear here.
                  </div>
                )}
              </div>

              <form className="support-composer" onSubmit={handleSubmit}>
                <div className="support-composer-shortcuts">
                  {FAQ_OPTIONS.slice(0, 5).map((option) => (
                    <button key={option.id} type="button" onClick={() => handleFaqClick(option)}>
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="support-composer-row">
                  <textarea
                    rows={3}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ask your question here..."
                  />
                  <button className="partner-primary-btn" type="submit">
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
