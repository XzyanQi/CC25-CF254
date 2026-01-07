import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  MessageSquare,
  Plus,
  Send,
  Smile,
  Trash2,
  User,
  XCircle,
  Home,
} from "lucide-react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import ReactMarkdown from "react-markdown";
import { sendToMindfulness } from "../api/chatbot";

const CHAT_SESSIONS_KEY = "mindfulnessChatSessions";
const MAX_RESPONSE_LENGTH = 5000;

const BANNED_WORDS = new Set([
  "kafir",
  "bom",
  "gay",
  "lesbi",
  "trans",
  "transgender",
  "homo",
  "dick",
  "iblis",
  "lonte",
  "pokkai",
  "agama",
  "islam",
  "kristen",
  "buddha",
  "hindu",
  "konghucu",
  "yahudi",
  "genoshida",
  "genosida",
  "perang",
]);

class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Chat Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6">
          <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-semibold text-red-600 mb-3">
              Oops! Terjadi kesalahan
            </h2>
            <p className="text-gray-600 mb-4">
              Silakan refresh halaman atau coba lagi nanti.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full sm:w-auto"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const TypingText = ({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsCompleted(false);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length && !isCompleted) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }

    if (currentIndex >= text.length && !isCompleted) {
      setIsCompleted(true);
      if (onComplete) onComplete();
    }
  }, [currentIndex, text, speed, onComplete, isCompleted]);

  return (
    <ReactMarkdown className="text-sm leading-relaxed whitespace-pre-wrap">
      {displayedText}
    </ReactMarkdown>
  );
};

function useIsDesktop(breakpointPx = 768) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia(`(min-width: ${breakpointPx}px)`).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const handler = (e) => setIsDesktop(e.matches);
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, [breakpointPx]);

  return isDesktop;
}

const ChatbotPage = () => {
  const [message, setMessage] = useState("");
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const isDesktop = useIsDesktop(768);
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [typingMessageId, setTypingMessageId] = useState(null);

  const chatEndRef = useRef(null);
  const emojiPickerButtonRef = useRef(null);
  const emojiPickerPopupRef = useRef(null);
  const inputWrapperRef = useRef(null);

  const navigate = useNavigate();

  const generateUniqueId = (prefix) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const handleHomeClick = () => navigate("/home");

  const handleNewChat = useCallback(() => {
    const newSessionId = generateUniqueId("session");
    const initialBotMessage = {
      id: generateUniqueId("bot"),
      text: "Halo! Saya Mindfulness, asisten AI kamu untuk mendengarkan dan membantu dalam hal kesehatan mental. Ceritakan perasaanmu atau masalahmu, aku akan berusaha membantumu.",
      sender: "bot",
      timestamp: new Date(),
      isTyping: true,
    };

    const newSession = {
      id: newSessionId,
      name: `Chat ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      messages: [initialBotMessage],
      lastUpdated: new Date(),
    };

    setChatSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setTypingMessageId(initialBotMessage.id);
    setMessage("");
    setShowEmojiPicker(false);

    if (!isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setMessage("");
    setShowEmojiPicker(false);
    setTypingMessageId(null);

    if (!isDesktop) setMobileSidebarOpen(false);
  };

  const handleDeleteSession = (sessionIdToDelete, event) => {
    event.stopPropagation();
    setChatSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionIdToDelete);

      if (activeSessionId === sessionIdToDelete) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          setTimeout(() => handleNewChat(), 0);
        }
      }
      return remaining;
    });
  };

  useEffect(() => {
    if (isInitialized) return;

    const saved = localStorage.getItem(CHAT_SESSIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatSessions(parsed);
          setActiveSessionId(parsed[0]?.id || null);
        } else {
          handleNewChat();
        }
      } catch {
        handleNewChat();
      }
    } else {
      handleNewChat();
    }

    setIsInitialized(true);
  }, [isInitialized, handleNewChat]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(chatSessions));
    }
  }, [chatSessions, isInitialized]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatSessions, isBotTyping]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inPopup = emojiPickerPopupRef.current?.contains(e.target);
      const inButton = emojiPickerButtonRef.current?.contains(e.target);
      if (!inPopup && !inButton) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cancelTyping = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsBotTyping(false);
  };

  const handleTypingComplete = useCallback(
    (messageId) => {
      setTypingMessageId(null);

      setChatSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeSessionId) return session;
          return {
            ...session,
            messages: session.messages.map((msg) =>
              msg.id === messageId ? { ...msg, isTyping: false } : msg
            ),
          };
        })
      );
    },
    [activeSessionId]
  );

  const parseApiResponse = (apiResponse) => {
    if (apiResponse && apiResponse.data) {
      if (Array.isArray(apiResponse.data.results) && apiResponse.data.results.length > 0) {
        return {
          response_to_display: apiResponse.data.results[0].response_to_display || "",
          confidence_score: apiResponse.data.results[0].confidence_score || 0,
          intent: apiResponse.data.results[0].intent || "",
          keywords: apiResponse.data.results[0].keywords || [],
        };
      }
      if (apiResponse.data.results && typeof apiResponse.data.results === "object") {
        return {
          response_to_display: apiResponse.data.results.response_to_display || "",
          confidence_score: apiResponse.data.results.confidence_score || 0,
          intent: apiResponse.data.results.intent || "",
          keywords: apiResponse.data.results.keywords || [],
        };
      }
      if (apiResponse.data.response_to_display) {
        return {
          response_to_display: apiResponse.data.response_to_display || "",
          confidence_score: apiResponse.data.confidence_score || 0,
          intent: apiResponse.data.intent || "",
          keywords: apiResponse.data.keywords || [],
        };
      }
    }

    if (apiResponse && Array.isArray(apiResponse.results) && apiResponse.results.length > 0) {
      return {
        response_to_display: apiResponse.results[0].response_to_display || "",
        confidence_score: apiResponse.results[0].confidence_score || 0,
        intent: apiResponse.results[0].intent || "",
        keywords: apiResponse.results[0].keywords || [],
      };
    }

    if (apiResponse && apiResponse.response_to_display) {
      return {
        response_to_display: apiResponse.response_to_display || "",
        confidence_score: apiResponse.confidence_score || 0,
        intent: apiResponse.intent || "",
        keywords: apiResponse.keywords || [],
      };
    }

    return {
      response_to_display: "Maaf, saya belum memahami pertanyaan Anda.",
      confidence_score: 0,
      intent: "clarification_needed",
      keywords: [],
    };
  };

  const handleSendMessage = async (messageText = null) => {
    const text = (messageText ?? message).trim();
    if (!text || !activeSessionId) return;

    const userMsg = {
      id: generateUniqueId("user"),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setIsBotTyping(true);
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [...s.messages, userMsg], lastUpdated: new Date() }
          : s
      )
    );
    setMessage("");
    setShowEmojiPicker(false);

    if ([...BANNED_WORDS].some((word) => text.toLowerCase().includes(word))) {
      const botMsgId = generateUniqueId("bot-banned");
      const botMsg = {
        id: botMsgId,
        text: "Maaf, saya tidak dapat membahas topik tersebut. Mari kita fokus pada hal-hal yang dapat membantu kesehatan mental kamu. Bagaimana perasaanmu hari ini?",
        sender: "bot",
        timestamp: new Date(),
        isTyping: true,
      };

      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, botMsg], lastUpdated: new Date() }
            : s
        )
      );
      setTypingMessageId(botMsgId);
      setIsBotTyping(false);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const data = await sendToMindfulness(text, 3, controller.signal);
      const parsedResult = parseApiResponse(data);

      if (!parsedResult.response_to_display?.trim()) {
        throw new Error("Empty response from API");
      }

      const botMsgId = generateUniqueId("bot");
      const botMsg = {
        id: botMsgId,
        text: parsedResult.response_to_display.slice(0, MAX_RESPONSE_LENGTH),
        sender: "bot",
        timestamp: new Date(),
        isTyping: true,
      };

      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, botMsg], lastUpdated: new Date() }
            : s
        )
      );
      setTypingMessageId(botMsgId);
    } catch (err) {
      if (err?.name === "AbortError") return;

      const errorBotMsgId = generateUniqueId("error");
      const errorBotMsg = {
        id: errorBotMsgId,
        text: "Oops! Terjadi kesalahan saat menghubungi server. Silakan coba lagi.",
        sender: "bot",
        timestamp: new Date(),
        isTyping: true,
      };

      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorBotMsg], lastUpdated: new Date() }
            : s
        )
      );
      setTypingMessageId(errorBotMsgId);
    } finally {
      setIsBotTyping(false);
      setAbortController(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeSession = chatSessions.find((s) => s.id === activeSessionId);

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat chat...</p>
        </div>
      </div>
    );
  }

  const sidebarExpandedDesktop = desktopSidebarExpanded;
  const sidebarWidthDesktop = sidebarExpandedDesktop ? "w-80" : "w-16";

  return (
    <ChatErrorBoundary>
      <div className="relative flex bg-gray-50 h-[100dvh]">
        {/* Mobile ini mah */}
        {!isDesktop && mobileSidebarOpen && (
          <button
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Tebak */}
        <aside
          className={[
            "z-50 bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
            isDesktop
              ? sidebarWidthDesktop
              : "fixed left-0 top-0 h-[100dvh] w-80 transform",
            !isDesktop && (mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"),
          ].join(" ")}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => {
                if (isDesktop) setDesktopSidebarExpanded((v) => !v);
                else setMobileSidebarOpen((v) => !v);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>

            {isDesktop && sidebarExpandedDesktop && (
              <h1 className="text-lg font-semibold text-gray-800">Mindfulness</h1>
            )}

            {!isDesktop && (
              <h1 className="text-lg font-semibold text-gray-800">Mindfulness</h1>
            )}
          </div>

          <div className="p-4">
            <button
              onClick={handleNewChat}
              className={[
                "w-full flex items-center gap-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors",
                isDesktop && !sidebarExpandedDesktop ? "justify-center" : "",
              ].join(" ")}
            >
              <Plus size={20} />
              {(!isDesktop || sidebarExpandedDesktop) && <span>New Chat</span>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {(isDesktop ? sidebarExpandedDesktop : true) && (
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-gray-500 mb-3">History Chat</h2>

                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={[
                      "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                      activeSessionId === session.id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{session.name}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                      aria-label="Delete session"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Tebak */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Tebak */}
          <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isDesktop && (
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Open sidebar"
                >
                  <Menu size={20} className="text-gray-600" />
                </button>
              )}

              <button
                onClick={handleHomeClick}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Home"
              >
                <Home size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="text-sm text-gray-600 font-medium truncate max-w-[60%] sm:max-w-[70%]">
              {activeSession?.name || "Chat"}
            </div>

            <div className="w-10" />
          </div>

          {/* Messages */}
          <section className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {activeSession?.messages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    M
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-2xl ${msg.sender === "user" ? "order-first" : ""}`}>
                  <div
                    className={[
                      "rounded-2xl px-4 py-3",
                      msg.sender === "user"
                        ? "bg-blue-500 text-white ml-auto"
                        : "bg-white border border-gray-200",
                    ].join(" ")}
                  >
                    {msg.sender === "bot" && msg.isTyping && typingMessageId === msg.id ? (
                      <TypingText
                        text={msg.text}
                        speed={30}
                        onComplete={() => handleTypingComplete(msg.id)}
                      />
                    ) : (
                      <ReactMarkdown className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </ReactMarkdown>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 mt-1.5 text-right">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {isBotTyping && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  M
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                  <span>Mindfulness sedang mengetik...</span>
                  <button
                    onClick={cancelTyping}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Cancel"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </section>

          {/* Input Bar */}
          <footer className="bg-white border-t border-gray-200 px-3 sm:px-4 py-3 sm:py-4">
            <div
              ref={inputWrapperRef}
              className="flex items-end gap-2 sm:gap-3 bg-gray-50 rounded-2xl px-3 sm:px-4 py-2 border border-gray-200"
            >
              <textarea
                className="flex-1 bg-transparent text-sm placeholder-gray-500 outline-none resize-none max-h-32 overflow-y-auto leading-relaxed py-1"
                placeholder="Ceritakan perasaanmu..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isBotTyping}
                rows={1}
              />

              <button
                ref={emojiPickerButtonRef}
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isBotTyping}
                aria-label="Emoji"
              >
                <Smile size={20} />
              </button>

              <button
                onClick={() => handleSendMessage()}
                disabled={!message.trim() || isBotTyping}
                className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </div>

            {showEmojiPicker && (
              <div
                ref={emojiPickerPopupRef}
                className="fixed z-[60] shadow-lg rounded-lg overflow-hidden
                           bottom-24 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-24"
              >
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setMessage((prev) => prev + emojiData.emoji);
                    setShowEmojiPicker(false);
                  }}
                  emojiStyle={EmojiStyle.NATIVE}
                  theme={Theme.LIGHT}
                  height={350}
                  width={isDesktop ? 360 : "100%"}
                  lazyLoadEmojis
                />
              </div>
            )}
          </footer>
        </main>
      </div>
    </ChatErrorBoundary>
  );
};

export default ChatbotPage;
