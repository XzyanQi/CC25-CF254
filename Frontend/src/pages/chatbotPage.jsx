import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Menu, MessageSquare, Plus, Send, Smile, Trash2, User } from 'lucide-react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { sendToMindfulness } from '../api/chatbot';

// Konstanta
const CHAT_SESSIONS_KEY = 'mindfulnessChatSessions';
const REQUEST_TIMEOUT = 30000; // 30 detik
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

const ChatbotPage = () => {
  // State
  const [message, setMessage] = useState('');
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);
  const emojiPickerButtonRef = useRef(null);
  const emojiPickerPopupRef = useRef(null);
  const sendMessageRef = useRef(null);

  // Navigation
  const navigate = useNavigate();

  // Utilities
  const generateUniqueId = useCallback((prefix) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }, []);

  const containsBannedWords = useCallback((text) => {
    const lowerCaseText = text.toLowerCase();
    const words = lowerCaseText.split(/[\s.,!?;:]+/).map(word => word.replace(/^[^\w]+|[^\w]+$/g, ""));
    return words.some(word => word !== '' && BANNED_WORDS.has(word));
  }, []);

  const cleanBotResponse = useCallback((responseData) => {
    if (!responseData) return { text: "Maaf, tidak ada respons dari server.", followUps: [], follow_up_answers: [] };
    let botReplyText = "";
    let followUps = [];
    let followUpAnswers = [];
    try {
      if (typeof responseData === 'string') {
        botReplyText = responseData.trim();
      } else if (responseData.message && typeof responseData.message === 'string') {
        botReplyText = responseData.message.trim();
      } else if (responseData.result && typeof responseData.result === 'string') {
        botReplyText = responseData.result.trim();
      } else if (responseData.response && typeof responseData.response === 'string') {
        botReplyText = responseData.response.trim();
      } else if (responseData.reply && typeof responseData.reply === 'string') {
        botReplyText = responseData.reply.trim();
      } else if (responseData.text && typeof responseData.text === 'string') {
        botReplyText = responseData.text.trim();
      } else if (responseData.content && typeof responseData.content === 'string') {
        botReplyText = responseData.content.trim();
      } else if (responseData.data && typeof responseData.data === 'string') {
        botReplyText = responseData.data.trim();
      } else if (responseData.results && Array.isArray(responseData.results)) {
        if (responseData.results.length > 0) {
          const validResults = responseData.results.filter(
            (r) => r.response_to_display && !r.response_to_display.toLowerCase().includes('kesalahan')
          );
          const bestResult = validResults.sort(
            (a, b) => (b.confidence_score || 0) - (a.confidence_score || 0)
          )[0];

          if (bestResult && bestResult.response_to_display) {
            botReplyText = bestResult.response_to_display.trim();
            followUps = Array.isArray(bestResult.follow_up_questions) ? bestResult.follow_up_questions : [];
            followUpAnswers = Array.isArray(bestResult.follow_up_answers) ? bestResult.follow_up_answers : [];
          } else {
            botReplyText = "Maaf, belum ada jawaban yang cocok untuk pertanyaanmu.";
          }
        } else {
          botReplyText = "Respons array kosong dari server.";
        }
      } else if (responseData.choices && Array.isArray(responseData.choices)) {
        if (responseData.choices.length > 0 && responseData.choices[0].message) {
          botReplyText = responseData.choices[0].message.content?.trim() ||
            responseData.choices[0].message.text?.trim() ||
            "Respons tidak valid dari choices.";
        } else {
          botReplyText = "Format choices tidak valid.";
        }
      } else {
        botReplyText = "Format respons tidak dikenal dari server.";
      }

      if (!botReplyText || botReplyText.length === 0) {
        botReplyText = "Maaf, respons kosong dari server.";
      }
      if (botReplyText.length > MAX_RESPONSE_LENGTH) {
        botReplyText = botReplyText.substring(0, MAX_RESPONSE_LENGTH) + "... (respons dipotong karena terlalu panjang)";
      }
      botReplyText = botReplyText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

      return { text: botReplyText, followUps, follow_up_answers: followUpAnswers };
    } catch (error) {
      console.error('Error cleaning bot response:', error);
      return { text: "Terjadi kesalahan saat memproses respons.", followUps: [], follow_up_answers: [] };
    }
  }, []);

  const handleApiError = useCallback((error) => {
    let errorMessage = "Oops! Terjadi kesalahan saat menghubungi server. Silakan coba lagi.";
    if (axios.isCancel(error)) {
      return null;
    } else if (error.response) {
      const status = error.response.status;
      const errorMessages = {
        400: "Permintaan tidak valid. Silakan coba lagi.",
        401: "Tidak memiliki akses. Silakan login kembali.",
        403: "Akses ditolak oleh server.",
        404: "Layanan tidak ditemukan.",
        429: "Terlalu banyak permintaan. Silakan tunggu sebentar.",
        500: "Server mengalami masalah. Silakan coba lagi nanti.",
        503: "Layanan sedang tidak tersedia. Silakan coba lagi nanti."
      };
      errorMessage = errorMessages[status] || `Server error (${status}). Silakan coba lagi.`;
    } else if (error.request) {
      errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
    }
    return errorMessage;
  }, []);

  // Fungsi kirim pesan (stable, pakai useRef untuk menghindari circular)
  const sendMessageFunction = useCallback(async (messageText = null) => {
    const userMessageText = (messageText || message).trim();
    if (!userMessageText || !activeSessionId) return;

    // Tambahkan pesan user
    const userMessage = {
      id: generateUniqueId('user'),
      text: userMessageText,
      sender: "user",
      timestamp: new Date()
    };

    setChatSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === activeSessionId) {
          const isFirstUserMessage = session.messages.filter(m => m.sender === 'user').length === 0;
          const newSessionName = isFirstUserMessage
            ? userMessage.text.substring(0, 25) + (userMessage.text.length > 25 ? '...' : '')
            : session.name;
          return {
            ...session,
            name: newSessionName,
            messages: [...session.messages, userMessage],
            lastUpdated: new Date()
          };
        }
        return session;
      }).sort((a, b) => b.lastUpdated - a.lastUpdated)
    );
    
    if (!messageText) setMessage('');
    setShowEmojiPicker(false);

    // Kata terlarang
    if (containsBannedWords(userMessageText)) {
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
        follow_up_answers: []
      };
      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, botCannedResponse], lastUpdated: new Date() }
            : session
        ).sort((a, b) => b.lastUpdated - a.lastUpdated)
      );
      return;
    }

    // Abort Controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const currentController = new AbortController();
    abortControllerRef.current = currentController;
    setIsBotTyping(true);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT);
      });
      const apiPromise = sendToMindfulness(userMessageText, currentController.signal);
      const botResponseData = await Promise.race([apiPromise, timeoutPromise]);
      
      if (abortControllerRef.current === currentController) {
        abortControllerRef.current = null;
      }

      // response bot
      const { text: botReplyText, followUps, follow_up_answers } = cleanBotResponse(botResponseData);
      const botMessage = {
        id: generateUniqueId('bot'),
        text: botReplyText,
        sender: "bot",
        timestamp: new Date(),
        followUps,
        follow_up_answers: follow_up_answers || []
      };

      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, botMessage], lastUpdated: new Date() }
            : session
        ).sort((a, b) => b.lastUpdated - a.lastUpdated)
      );
    } catch (error) {
      if (abortControllerRef.current === currentController) {
        abortControllerRef.current = null;
      }
      const errorMessage = handleApiError(error);
      if (errorMessage) {
        const errorBotMessage = {
          id: generateUniqueId('error'),
          text: errorMessage,
          sender: "bot",
          timestamp: new Date(),
          followUps: [
            "Coba kirim pesan lagi",
            "Periksa koneksi internet",
            "Refresh halaman"
          ],
          follow_up_answers: []
        };
        setChatSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === activeSessionId
              ? { ...session, messages: [...session.messages, errorBotMessage], lastUpdated: new Date() }
              : session
          ).sort((a, b) => b.lastUpdated - a.lastUpdated)
        );
      }
    } finally {
      setIsBotTyping(false);
    }
  }, [message, activeSessionId, generateUniqueId, containsBannedWords, cleanBotResponse, handleApiError]);

  // Update ref agar stable reference
  useEffect(() => {
    sendMessageRef.current = sendMessageFunction;
  }, [sendMessageFunction]);

  // Handler klik follow up (pakai ref untuk call sendMessageFunction)
  const handleFollowUpClick = useCallback((question, answer = null) => {
    setMessage('');
    if (answer) {
      const userMessage = {
        id: generateUniqueId('user'),
        text: question,
        sender: "user",
        timestamp: new Date()
      };
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
                messages: [
                  ...session.messages,
                  userMessage,
                  botMessage
                ],
                lastUpdated: new Date()
              }
            : session
        ).sort((a, b) => b.lastUpdated - a.lastUpdated)
      );
    } else {
      if (sendMessageRef.current) {
        sendMessageRef.current(question);
      }
    }
  }, [activeSessionId, generateUniqueId]);

  // Manage Chat Sessions, delete, select, new
  const handleNewChat = useCallback((updateFromExistingSessions = true) => {
    const newSessionId = generateUniqueId('session');
    const initialBotMessageText = "Halo! Saya Mindfulness, asisten AI kamu untuk mendengarkan dan membantu dalam hal kesehatan mental. Bagaimana perasaanmu hari ini? 😊";
    const newSession = {
      id: newSessionId,
      name: `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      messages: [
        {
          id: generateUniqueId('bot'),
          text: initialBotMessageText,
          sender: "bot",
          timestamp: new Date(),
          followUps: [
            "Ceritakan tentang perasaanmu",
            "Apa yang membuatmu khawatir?",
            "Bagaimana kualitas tidurmu?"
          ],
          follow_up_answers: []
        }
      ],
      lastUpdated: new Date()
    };

    if (updateFromExistingSessions) {
      setChatSessions(prev => [newSession, ...prev].sort((a, b) => b.lastUpdated - a.lastUpdated));
    } else {
      setChatSessions([newSession]);
    }
    setActiveSessionId(newSessionId);
    setMessage('');
    setIsBotTyping(false);
    setShowEmojiPicker(false);
  }, [generateUniqueId]);

  const handleSelectSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
    setMessage('');
    setIsBotTyping(false);
    setShowEmojiPicker(false);
  }, []);

  const handleDeleteSession = useCallback((sessionIdToDelete, event) => {
    event.stopPropagation();
    const sessionsAfterDelete = chatSessions.filter(session => session.id !== sessionIdToDelete);
    setChatSessions(sessionsAfterDelete);

    if (activeSessionId === sessionIdToDelete) {
      if (sessionsAfterDelete.length > 0) {
        sessionsAfterDelete.sort((a, b) => b.lastUpdated - a.lastUpdated);
        setActiveSessionId(sessionsAfterDelete[0].id);
      } else {
        handleNewChat(false);
      }
    }
  }, [chatSessions, activeSessionId, handleNewChat]);

  // Load dan Save sesi (localStorage)
  useEffect(() => {
    const loadSessions = () => {
      try {
        const savedSessions = localStorage.getItem(CHAT_SESSIONS_KEY);
        let loadedSessions = [];
        if (savedSessions) {
          const parsed = JSON.parse(savedSessions);
          loadedSessions = parsed.map(session => ({
            ...session,
            messages: session.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })),
            lastUpdated: new Date(session.lastUpdated)
          }));
        }
        if (loadedSessions.length > 0) {
          loadedSessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
          setChatSessions(loadedSessions);
          setActiveSessionId(loadedSessions[0].id);
        } else {
          handleNewChat(false);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading sessions:', error);
        handleNewChat(false);
        setIsInitialized(true);
      }
    };
    loadSessions();
  }, [handleNewChat]);

  useEffect(() => {
    if (chatSessions.length > 0) {
      try {
        localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(chatSessions));
      } catch (error) {
        console.error('Error saving sessions:', error);
      }
    } else if (localStorage.getItem(CHAT_SESSIONS_KEY)) {
      localStorage.removeItem(CHAT_SESSIONS_KEY);
    }
  }, [chatSessions]);

  // Memoized current messages
  const currentMessages = useMemo(() => {
    const activeSession = chatSessions.find(s => s.id === activeSessionId);
    return activeSession ? activeSession.messages : [];
  }, [chatSessions, activeSessionId]);

  // Auto Scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages]);

  // Clean About Controller
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Emoji Picker
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

  // Emoji Picker
  const onEmojiClick = useCallback((emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
  }, []);

  // Send Message handler
  const sendMessage = useCallback(() => {
    sendMessageFunction();
  }, [sendMessageFunction]);

  // Handler
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const formatTime = useCallback((date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Loading state
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

  // Render
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
              onClick={() => handleNewChat()}
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
                                    onClick={() =>
                                      handleFollowUpClick(
                                        q,
                                        Array.isArray(msg.follow_up_answers) && msg.follow_up_answers[i]
                                          ? msg.follow_up_answers[i]
                                          : null
                                      )
                                    }
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
                      onClick={sendMessage}
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
                      onEmojiClick={onEmojiClick}
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
