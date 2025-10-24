"use client";

import { FormEvent, useMemo, useState } from "react";
import useSWR from "swr";

type AgentPersona = {
  name: string;
  bio: string;
  tone: "friendly" | "professional" | "enthusiastic" | "analytical";
  objective: string;
  greeting: string;
};

type Group = {
  id: string;
  name: string;
  description?: string;
  joinedAt: string;
};

type AgentMessage = {
  id: string;
  groupId: string;
  sender: string;
  content: string;
  timestamp: string;
  fromAgent: boolean;
};

type AgentState = {
  persona: AgentPersona;
  groups: Group[];
  messages: AgentMessage[];
  status: {
    connected: boolean;
    lastInbound?: string | null;
    lastOutbound?: string | null;
  };
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return res.json();
};

export default function Home() {
  const { data, mutate, isLoading } = useSWR<AgentState>("/api/state", fetcher, {
    refreshInterval: 5000
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState("");
  const [joinPayload, setJoinPayload] = useState({ inviteCode: "", name: "", description: "" });
  const [savingPersona, setSavingPersona] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const groups = useMemo(() => data?.groups ?? [], [data?.groups]);
  const persona = data?.persona;

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return groups[0];
    return groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  }, [groups, selectedGroupId]);

  const messages = useMemo(() => {
    if (!selectedGroup) return [];
    return (data?.messages ?? []).filter((msg) => msg.groupId === selectedGroup.id);
  }, [data?.messages, selectedGroup]);

  async function handlePersonaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!persona) return;
    setSavingPersona(true);
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    try {
      await fetch("/api/persona", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      await mutate();
      setFeedback("Persona updated");
    } catch (error) {
      console.error(error);
      setFeedback("Failed to update persona");
    } finally {
      setSavingPersona(false);
    }
  }

  async function handleGroupJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    try {
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload)
      });
      setJoinPayload({ inviteCode: "", name: "", description: "" });
      await mutate();
      setFeedback("Group joined successfully");
    } catch (error) {
      console.error(error);
      setFeedback("Failed to join group");
    }
  }

  async function handleSendMessage(event: FormEvent) {
    event.preventDefault();
    if (!selectedGroup || !pendingMessage.trim()) return;
    setSending(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          content: pendingMessage
        })
      });
      setPendingMessage("");
      await mutate();
      setFeedback("Message dispatched");
    } catch (error) {
      console.error(error);
      setFeedback("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <div className="app-card">
        <header>
          <div>
            <h1>WhatsApp Group Agent</h1>
            <p>Autonomous teammate who can join groups, craft replies, and stay on persona.</p>
          </div>
          <div className={`status-pill ${data?.status.connected ? "online" : "offline"}`}>
            {data?.status.connected ? "Connected" : "Disconnected"}
          </div>
        </header>
        {feedback && <div className="feedback">{feedback}</div>}
        <section className="dashboard">
          <aside>
            <div className="panel">
              <h2>Groups</h2>
              <ul>
                {groups.map((group) => (
                  <li
                    key={group.id}
                    className={selectedGroup?.id === group.id ? "active" : ""}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <strong>{group.name}</strong>
                    <span>{new Date(group.joinedAt).toLocaleString()}</span>
                  </li>
                ))}
                {groups.length === 0 && <p className="empty">No groups yet</p>}
              </ul>
              <form className="panel" onSubmit={handleGroupJoin}>
                <h3>Join new group</h3>
                <label>
                  Invite code
                  <input
                    value={joinPayload.inviteCode}
                    onChange={(event) =>
                      setJoinPayload((prev) => ({ ...prev, inviteCode: event.target.value }))
                    }
                    placeholder="Paste invite code"
                    required
                  />
                </label>
                <label>
                  Friendly name
                  <input
                    value={joinPayload.name}
                    onChange={(event) =>
                      setJoinPayload((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Product Community"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={3}
                    value={joinPayload.description}
                    onChange={(event) =>
                      setJoinPayload((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </label>
                <button type="submit">Join group</button>
              </form>
            </div>
          </aside>
          <section className="chat">
            <div className="messages">
              {isLoading && <p>Loading conversation…</p>}
              {!isLoading && messages.length === 0 && <p className="empty">No messages yet</p>}
              {messages.map((message) => (
                <article key={message.id} className={message.fromAgent ? "agent" : "member"}>
                  <header>
                    <span>{message.sender}</span>
                    <time>{new Date(message.timestamp).toLocaleTimeString()}</time>
                  </header>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>
            <form className="composer" onSubmit={handleSendMessage}>
              <textarea
                placeholder="Draft a manual agent response"
                value={pendingMessage}
                onChange={(event) => setPendingMessage(event.target.value)}
                rows={3}
              />
              <button type="submit" disabled={sending || !pendingMessage.trim()}>
                {sending ? "Sending…" : "Send as agent"}
              </button>
            </form>
          </section>
          <section className="persona">
            {persona && (
              <form onSubmit={handlePersonaSubmit}>
                <h2>Persona settings</h2>
                <label>
                  Display name
                  <input name="name" defaultValue={persona.name} required />
                </label>
                <label>
                  Tone
                  <select name="tone" defaultValue={persona.tone}>
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="analytical">Analytical</option>
                  </select>
                </label>
                <label>
                  Objective
                  <textarea name="objective" rows={3} defaultValue={persona.objective} />
                </label>
                <label>
                  Bio
                  <textarea name="bio" rows={3} defaultValue={persona.bio} />
                </label>
                <label>
                  Greeting
                  <textarea name="greeting" rows={2} defaultValue={persona.greeting} />
                </label>
                <button type="submit" disabled={savingPersona}>
                  {savingPersona ? "Saving…" : "Save persona"}
                </button>
              </form>
            )}
          </section>
        </section>
      </div>
      <style jsx>{`
        .app-card {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid #1e293b;
          border-radius: 24px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.6);
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        h1 {
          margin: 0 0 8px;
          font-size: 32px;
        }
        p {
          margin: 0;
        }
        .status-pill {
          padding: 8px 16px;
          border-radius: 999px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.08em;
        }
        .status-pill.online {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }
        .status-pill.offline {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .dashboard {
          display: grid;
          gap: 24px;
          grid-template-columns: 280px 1fr 320px;
        }
        aside {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(30, 41, 59, 0.8);
          border-radius: 20px;
          padding: 16px 20px;
        }
        .panel ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 320px;
          overflow: auto;
        }
        .panel li {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
          border: 1px solid transparent;
        }
        .panel li.active {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
        }
        .panel li:not(.active):hover {
          background: rgba(56, 189, 248, 0.08);
        }
        .panel li strong {
          font-size: 15px;
        }
        .panel li span {
          font-size: 12px;
          opacity: 0.7;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 14px;
        }
        button {
          background: linear-gradient(135deg, #38bdf8, #818cf8);
          border: none;
          color: white;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: filter 0.2s ease;
        }
        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        button:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        .chat {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(30, 41, 59, 0.8);
          border-radius: 20px;
          padding: 20px;
          min-height: 600px;
        }
        .messages {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: auto;
        }
        .messages article {
          border-radius: 12px;
          padding: 12px 16px;
          max-width: 80%;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.1);
        }
        .messages article.agent {
          align-self: flex-end;
          background: rgba(56, 189, 248, 0.15);
          border-color: rgba(56, 189, 248, 0.3);
        }
        .messages article header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 8px;
          opacity: 0.8;
        }
        .messages article p {
          margin: 0;
          white-space: pre-wrap;
        }
        .composer {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .composer textarea {
          resize: vertical;
        }
        .persona {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(30, 41, 59, 0.8);
          border-radius: 20px;
          padding: 20px;
        }
        .persona form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .feedback {
          padding: 10px 16px;
          border-radius: 12px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .empty {
          opacity: 0.6;
          font-style: italic;
        }
        @media (max-width: 1100px) {
          .dashboard {
            grid-template-columns: 1fr;
          }
          aside,
          .chat,
          .persona {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
