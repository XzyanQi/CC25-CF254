import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Menu, MessageSquare, Plus, Send, Smile, Trash2, User } from 'lucide-react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import ReactMarkdown from 'react-markdown';
import { sendToMindfulness } from '../api/chatbot';

// Konstanta
const CHAT_SESSIONS_KEY = 'mindfulnessChatSessions';
const MAX_RESPONSE_LENGTH = 5000;
const BANNED_WORDS = new Set([
  'kafir', 'bom', 'gay', 'lesbi', 'trans', 'transgender', 'homo', 'dick', 'iblis', 'lonte', 'pokkai',
  'agama', 'islam', 'kristen', 'buddha', 'hindu', 'konghucu', 'yahudi', 'genoshida', 'genosida', 'perang'
]);

// Error Boundary untuk menangkap error di komponen chat
class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Chat Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Oops! Terjadi kesalahan</h2>
            <p className="text-gray-600 mb-4">Silakan refresh halaman atau coba lagi nanti.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

// Fungsi swap fixFollowUp: dari corpus, follow_up_answers sebenarnya pertanyaan, follow_up_questions sebenarnya jawaban
function fixFollowUp(follow_up_questions, follow_up_answers) {
  return [follow_up_answers, follow_up_questions];
}

const ChatbotPage = () => {
  const [message, setMessage] = useState('');
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const chatEndRef = useRef(null);
  const emojiPickerButtonRef = useRef(null);
  const emojiPickerPopupRef = useRef(null);

  const navigate = useNavigate();

  const generateUniqueId = useCallback((prefix) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }, []);

  // Chat session management
  const handleNewChat = useCallback(() => {
    const newSessionId = generateUniqueId('session');
    const initialBotMessageText = "Halo! Saya Mindfulness, asisten AI kamu untuk mendengarkan dan membantu dalam hal kesehatan mental. Ceritakan perasaanmu atau masalahmu, aku akan berusaha membantumu.";
    const newSession = {
      id: newSessionId,
      name: `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      messages: [
        {
          id: generateUniqueId('bot'),
          text: initialBotMessageText,
          sender: "bot",
          timestamp: new Date(),
          followUps: [],
          follow_up_answers: []
        }
      ],
      lastUpdated: new Date()
    };
    setChatSessions([newSession]);
    setActiveSessionId(newSessionId);
    setMessage('');
    setShowEmojiPicker(false);
  }, [generateUniqueId]);

  const handleSelectSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
    setMessage('');
    setShowEmojiPicker(false);
  }, []);

  const handleDeleteSession = useCallback((sessionIdToDelete, event) => {
    event.stopPropagation();
    const sessionsAfterDelete = chatSessions.filter(session => session.id !== sessionIdToDelete);
    setChatSessions(sessionsAfterDelete);
    if (activeSessionId === sessionIdToDelete) {
      if (sessionsAfterDelete.length > 0) {
        setActiveSessionId(sessionsAfterDelete[0].id);
      } else {
        handleNewChat();
      }
    }
  }, [chatSessions, activeSessionId, handleNewChat]);

  // Load/save sesi dari localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem(CHAT_SESSIONS_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setChatSessions(parsed);
        setActiveSessionId(parsed[0]?.id || null);
      } catch {}
    } else {
      handleNewChat();
    }
    setIsInitialized(true);
  }, [handleNewChat]);
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  // Auto scroll
  const activeSession = chatSessions.find(s => s.id === activeSessionId);
  const currentMessages = activeSession ? activeSession.messages : [];
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // Emoji picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        emojiPickerPopupRef.current &&
        !emojiPickerPopupRef.current.contains(event.target) &&
        emojiPickerButtonRef.current &&
        !emojiPickerButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Kirim pesan user
  const handleSendMessage = useCallback(async () => {
    const userMessageText = message.trim();
    if (!userMessageText || !activeSessionId) return;

    // Tambahkan pesan user ke chat
    const userMessage = {
      id: generateUniqueId('user'),
      text: userMessageText,
      sender: "user",
      timestamp: new Date()
    };
    setIsBotTyping(true);

    setChatSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === activeSessionId
          ? {
              ...session,
              messages: [...session.messages, userMessage],
              lastUpdated: new Date()
            }
          : session
      )
    );
    setMessage('');
    setShowEmojiPicker(false);

    // Kata terlarang dan template
    if ([...BANNED_WORDS].some(word => userMessageText.toLowerCase().includes(word))) {
      // Template banned: followUps = pertanyaan, follow_up_answers = jawaban
      const botCannedResponse = {
        id: generateUniqueId('bot-banned'),
        text: "Maaf, saya tidak dapat membahas topik tersebut. Mari kita fokus pada hal-hal yang dapat membantu kesehatan mental kamu. Bagaimana perasaanmu hari ini?",
        sender: "bot",
        timestamp: new Date(),
        followUps: [
          "Ceritakan tentang harimu",
          "Apa yang membuatmu bahagia?",
          "Bagaimana cara kamu mengatasi stres?"
        ],
        follow_up_answers: [
          "Setiap hari, meskipun terasa berat, pasti ada satu hal kecil yang bisa kamu syukuri. Semangat ya, kamu tidak sendiri!",
          "Hal membahagiakan bisa datang dari hal-hal sederhana. Semoga hari ini kamu menemukan kebahagiaan kecil yang berarti.",
          "Mengatasi stres itu proses, dan kamu sudah hebat bisa melewatinya sejauh ini. Tetap jaga dirimu, kamu pasti bisa!"
        ]
      };
      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, botCannedResponse], lastUpdated: new Date() }
            : session
        )
      );
      setIsBotTyping(false);
      return;
    }

    try {
      const data = await sendToMindfulness(userMessageText);

      let results = Array.isArray(data.results) ? data.results : [];
      const nonTemplate = results.filter(
        r =>
          !r.response_to_display?.toLowerCase().startsWith("terima kasih sudah berbagi")
          && !r.response_to_display?.toLowerCase().includes("saya di sini untuk mendengarkan")
      );
      let topResult = nonTemplate.length > 0
        ? nonTemplate.sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))[0]
        : results[0] || {};

      // Di corpus kebalik, fix di sini
      let followUpsRaw = Array.isArray(topResult.follow_up_questions) ? topResult.follow_up_questions : [];
      let followUpAnswersRaw = Array.isArray(topResult.follow_up_answers) ? topResult.follow_up_answers : [];
      const [followUps, follow_up_answers] = fixFollowUp(followUpsRaw, followUpAnswersRaw);

      const botMessage = {
        id: generateUniqueId('bot'),
        text: topResult.response_to_display?.slice(0, MAX_RESPONSE_LENGTH) || "Maaf, belum ada jawaban yang cocok.",
        sender: "bot",
        timestamp: new Date(),
        followUps,
        follow_up_answers
      };

      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, botMessage], lastUpdated: new Date() }
            : session
        )
      );
    } catch (error) {
      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    id: generateUniqueId('error'),
                    text: "Oops! Terjadi kesalahan saat menghubungi server. Silakan coba lagi.",
                    sender: "bot",
                    timestamp: new Date(),
                    followUps: [],
                    follow_up_answers: []
                  }
                ],
                lastUpdated: new Date()
              }
            : session
        )
      );
    } finally {
      setIsBotTyping(false);
    }
  }, [message, activeSessionId, generateUniqueId]);

  // Fungsi follow up
  const handleFollowUpClick = useCallback(
    async (question, answer = null) => {
      if (!activeSessionId) return;

      const userMessage = {
        id: generateUniqueId('user'),
        text: question,
        sender: "user",
        timestamp: new Date()
      };

      setIsBotTyping(true);

      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: [...session.messages, userMessage],
                lastUpdated: new Date()
              }
            : session
        )
      );
      setMessage('');
      setShowEmojiPicker(false);

      if (answer) {
        const botMessage = {
          id: generateUniqueId('bot-followup'),
          text: answer,
          sender: "bot",
          timestamp: new Date(),
          followUps: [],
          follow_up_answers: []
        };
        setChatSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === activeSessionId
              ? {
                  ...session,
                  messages: [...session.messages, botMessage],
                  lastUpdated: new Date()
                }
              : session
          )
        );
        setIsBotTyping(false);
        return;
      }

      try {
        const data = await sendToMindfulness(question);
        let results = Array.isArray(data.results) ? data.results : [];
        const nonTemplate = results.filter(
          r =>
            !r.response_to_display?.toLowerCase().startsWith("terima kasih sudah berbagi") &&
            !r.response_to_display?.toLowerCase().includes("saya di sini untuk mendengarkan")
        );
        let topResult = nonTemplate.length > 0
          ? nonTemplate.sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))[0]
          : results[0] || {};

        let followUpsRaw = Array.isArray(topResult.follow_up_questions) ? topResult.follow_up_questions : [];
        let followUpAnswersRaw = Array.isArray(topResult.follow_up_answers) ? topResult.follow_up_answers : [];
        const [followUps, follow_up_answers] = fixFollowUp(followUpsRaw, followUpAnswersRaw);

        const botMessage = {
          id: generateUniqueId('bot'),
          text: topResult.response_to_display?.slice(0, MAX_RESPONSE_LENGTH) || "Maaf, belum ada jawaban yang cocok.",
          sender: "bot",
          timestamp: new Date(),
          followUps,
          follow_up_answers
        };

        setChatSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === activeSessionId
              ? { ...session, messages: [...session.messages, botMessage], lastUpdated: new Date() }
              : session
          )
        );
      } catch (error) {
        setChatSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === activeSessionId
              ? {
                  ...session,
                  messages: [
                    ...session.messages,
                    {
                      id: generateUniqueId('error'),
                      text: "Oops! Terjadi kesalahan saat menghubungi server. Silakan coba lagi.",
                      sender: "bot",
                      timestamp: new Date(),
                      followUps: [],
                      follow_up_answers: []
                    }
                  ],
                  lastUpdated: new Date()
                }
              : session
          )
        );
      } finally {
        setIsBotTyping(false);
      }
    },
    [activeSessionId, generateUniqueId]
  );

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat chat...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatErrorBoundary>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden flex flex-col`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-gray-800">Mindfulness Chat</h1>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 rounded">
                <Menu size={20} className="text-gray-600" />
              </button>
            </div>
            <button
              onClick={handleNewChat}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-100 rounded-lg border border-gray-300 mb-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus size={18} className="text-gray-700" />
              <span className="text-sm font-medium text-gray-800">Chat Baru</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">Riwayat</h3>
            {chatSessions.map(session => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                title={session.name}
                className={`group w-full flex items-center justify-between space-x-2 p-2.5 text-left text-sm rounded-lg cursor-pointer transition-colors ${
                  activeSessionId === session.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  <MessageSquare size={16} className={activeSessionId === session.id ? 'text-blue-600' : 'text-gray-500'} />
                  <span className="truncate font-medium">{session.name}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-500 transition-opacity"
                  title="Hapus chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {chatSessions.length === 0 && (
              <p className="text-xs text-gray-400 text-center px-1">Belum ada riwayat chat.</p>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/home')}
                title="Home"
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                <Home size={20} className="text-gray-700" />
              </button>
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-200 rounded-full">
                  <Menu size={20} className="text-gray-700" />
                </button>
              )}
              <h2 className="text-lg font-semibold text-gray-800">
                Mindfulness AI
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <div className="max-w-3xl mx-auto space-y-6">
              {currentMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                      msg.sender === 'user' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      {msg.sender === 'user' ? <User size={16} /> : <span className="text-sm font-bold">M</span>}
                    </div>
                    <div className={`rounded-xl px-4 py-3 shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                    }`}>
                      {msg.sender === 'bot' ? (
                        <div>
                          <ReactMarkdown className="text-sm leading-relaxed markdown-body whitespace-pre-wrap">
                            {msg.text}
                          </ReactMarkdown>
                          {Array.isArray(msg.followUps) && msg.followUps.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-2">Pertanyaan lanjutan:</p>
                              <ul className="space-y-1">
                                {msg.followUps.map((q, i) => (
                                  <li
                                    key={i}
                                    className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 transition-colors"
                                    onClick={() => handleFollowUpClick(
                                      q,
                                      Array.isArray(msg.follow_up_answers) && msg.follow_up_answers[i]
                                        ? msg.follow_up_answers[i]
                                        : null
                                    )}
                                  >
                                    {q}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        msg.text.split("\n").map((line, i) => (
                          <p key={i} className="text-sm mb-2 whitespace-pre-line">{line.trim()}</p>
                        ))
                      )}
                    </div>
                  </div>
                  <p className={`text-xs mt-1.5 px-2 ${msg.sender === 'user' ? 'text-gray-400 self-end' : 'text-gray-400 self-start ml-11'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              ))}
              {isBotTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 text-white">
                      <span className="text-sm font-bold">M</span>
                    </div>
                    <div className="rounded-xl px-4 py-3 bg-white border border-gray-200 text-gray-800 shadow-sm rounded-bl-none">
                      <p className="text-sm italic">Mindfulness sedang mengetik...</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="bg-gray-50 border-t border-gray-200 p-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="flex items-center bg-white rounded-full border border-gray-300 px-2 py-1 shadow-sm">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ceritakan perasaanmu..."
                    className="flex-1 px-4 py-2.5 border-none focus:ring-0 text-sm bg-transparent"
                    disabled={isBotTyping}
                  />
                  <div className="flex items-center space-x-1 pr-1">
                    <button
                      ref={emojiPickerButtonRef}
                      title="Insert Emoji"
                      onClick={() => setShowEmojiPicker(prev => !prev)}
                      className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                      disabled={isBotTyping}
                    >
                      <Smile size={18} />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                      disabled={isBotTyping || !message.trim()}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerPopupRef}
                    style={{ position: 'absolute', bottom: 'calc(100% + 8px)', right: '0px', zIndex: 50 }}
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) => setMessage(prev => prev + emojiData.emoji)}
                      autoFocusSearch={false}
                      emojiStyle={EmojiStyle.NATIVE}
                      theme={Theme.LIGHT}
                      height={350}
                      lazyLoadEmojis={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChatErrorBoundary>
  );
};

export default ChatbotPage;
