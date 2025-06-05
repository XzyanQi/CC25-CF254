import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Menu, MessageSquare, Plus, Send, Smile, Trash2, User, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import ReactMarkdown from 'react-markdown';
import { sendToMindfulness } from '../api/chatbot';

// Konstanta untuk aplikasi
const CHAT_SESSIONS_KEY = 'mindfulnessChatSessions';
const MAX_RESPONSE_LENGTH = 5000;
const BANNED_WORDS = new Set([
  'kafir', 'bom', 'gay', 'lesbi', 'trans', 'transgender', 'homo', 'dick', 'iblis', 'lonte', 'pokkai',
  'agama', 'islam', 'kristen', 'buddha', 'hindu', 'konghucu', 'yahudi', 'genoshida', 'genosida', 'perang'
]);

// Komponen Status Koneksi
const ConnectionStatus = ({ isConnecting, lastError }) => {
  if (!isConnecting && !lastError) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      lastError ? 'bg-red-100' : 'bg-blue-100'
    }`}>
      <div className="flex items-center gap-3">
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm font-medium text-blue-700">
              Sedang mengirim pesan...
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700">Kesalahan</p>
              <p className="text-xs text-red-600">{lastError}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Error Boundary Component
class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Kesalahan Chat:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              Ups! Terjadi kesalahan
            </h2>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'Silakan muat ulang halaman atau coba lagi nanti.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              Muat Ulang Halaman
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
  const [abortController, setAbortController] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  // Refs
  const chatEndRef = useRef(null);
  const emojiPickerButtonRef = useRef(null);
  const emojiPickerPopupRef = useRef(null);
  
  const navigate = useNavigate();

  // Utility functions
  const generateUniqueId = useCallback((prefix) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }, []);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Format waktu
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Manajemen sesi chat
  const handleNewChat = useCallback(() => {
    const newSessionId = generateUniqueId('session');
    const pesanAwalBot = "Halo! Saya Mindfulness, asisten AI kamu untuk mendengarkan dan membantu dalam hal kesehatan mental. Ceritakan perasaanmu atau masalahmu, aku akan berusaha membantumu.";
    
    const newSession = {
      id: newSessionId,
      name: `Chat ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      messages: [
        {
          id: generateUniqueId('bot'),
          text: pesanAwalBot,
          sender: "bot",
          timestamp: new Date(),
          followUpQuestions: [],
          followUpAnswers: [],
          recomendedResponsesToFollowUpAnswers: []
        }
      ],
      lastUpdated: new Date()
    };

    setChatSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setMessage('');
    setShowEmojiPicker(false);
    setConnectionError(null);
    console.log('[CHAT] Membuat sesi chat baru:', newSessionId);
  }, [generateUniqueId]);

  // Handle pemilihan sesi
  const handleSelectSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
    setMessage('');
    setShowEmojiPicker(false);
    setConnectionError(null);
    console.log('[CHAT] Memilih sesi:', sessionId);
  }, []);

  // Handle penghapusan sesi
  const handleDeleteSession = useCallback((sessionIdToDelete, event) => {
    event.stopPropagation();
    setChatSessions(prev => prev.filter(session => session.id !== sessionIdToDelete));
    console.log('[CHAT] Menghapus sesi:', sessionIdToDelete);
    
    if (activeSessionId === sessionIdToDelete) {
      const remainingSessions = chatSessions.filter(s => s.id !== sessionIdToDelete);
      if (remainingSessions.length > 0) {
        setActiveSessionId(remainingSessions[0].id);
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
        console.log('[CHAT] Memuat sesi dari localStorage');
      } catch (e) {
        console.error('[CHAT] Error parsing localStorage:', e);
        handleNewChat();
      }
    } else {
      handleNewChat();
    }
    setIsInitialized(true);
  }, [handleNewChat]);

  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(chatSessions));
      console.log('[CHAT] Menyimpan sesi ke localStorage');
    }
  }, [chatSessions]);

  // Auto scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatSessions]);

  // Network status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionError(null);
      console.log('[SYSTEM] Koneksi internet tersambung kembali');
    };

    const handleOffline = () => {
      setConnectionError('Tidak ada koneksi internet');
      console.log('[SYSTEM] Koneksi internet terputus');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Handle kirim pesan
  const handleSendMessage = useCallback(async () => {
    const userMessageText = message.trim();
    if (!userMessageText || !activeSessionId) return;

    setConnectionError(null);

    // Buat pesan user
    const userMessage = {
      id: generateUniqueId('user'),
      text: userMessageText,
      sender: "user",
      timestamp: new Date()
    };

    setIsBotTyping(true);

    // Update state dengan pesan user
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

    // Cek kata terlarang
    if ([...BANNED_WORDS].some(word => userMessageText.toLowerCase().includes(word))) {
      const botResponse = {
        id: generateUniqueId('bot'),
        text: "Maaf, saya tidak dapat membahas topik tersebut. Mari fokus pada kesehatan mentalmu. Bagaimana perasaanmu hari ini?",
        sender: "bot",
        timestamp: new Date(),
        followUpQuestions: [
          "Ceritakan tentang harimu",
          "Apa yang membuatmu bahagia?",
          "Bagaimana cara kamu mengatasi stres?"
        ],
        followUpAnswers: [
          "Setiap hari pasti ada hal baik yang bisa disyukuri. Ayo ceritakan lebih lanjut.",
          "Kebahagiaan bisa datang dari hal sederhana. Mari berbagi cerita.",
          "Kamu hebat sudah mencoba mengatasi stres. Bagaimana prosesnya?"
        ]
      };

      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, botResponse] }
            : session
        )
      );
      
      setIsBotTyping(false);
      return;
    }

    // Kirim ke backend
    try {
      const controller = new AbortController();
      setAbortController(controller);

      const response = await sendToMindfulness(userMessageText);
      
      if (!response) throw new Error('Tidak ada respons dari server');

      const botMessage = {
        id: generateUniqueId('bot'),
        text: response.text || "Maaf, saya tidak mengerti. Bisa dijelaskan dengan cara lain?",
        sender: "bot",
        timestamp: new Date(),
        followUpQuestions: response.followUpQuestions || [],
        followUpAnswers: response.followUpAnswers || [],
        recomendedResponsesToFollowUpAnswers: response.recomendedResponsesToFollowUpAnswers || []
      };

      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, botMessage] }
            : session
        )
      );

    } catch (error) {
      console.error('[CHAT] Error:', error);
      
      let errorMessage = "Maaf, terjadi kesalahan. Silakan coba lagi.";
      
      if (error.name === 'AbortError') {
        errorMessage = "Permintaan dibatalkan.";
      } else if (!navigator.onLine) {
        errorMessage = "Tidak ada koneksi internet.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Waktu respons habis. Silakan coba lagi.";
      }

      setConnectionError(errorMessage);

      // Tambahkan pesan error ke chat
      const errorBotMessage = {
        id: generateUniqueId('bot-error'),
        text: errorMessage,
        sender: "bot",
        timestamp: new Date(),
        followUpQuestions: [],
        followUpAnswers: []
      };

      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, errorBotMessage] }
            : session
        )
      );

    } finally {
      setIsBotTyping(false);
      setAbortController(null);
    }
  }, [message, activeSessionId, generateUniqueId]);

  // Handle emoji picker
  const onEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle keyboard
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

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

  // Render utama
  const activeSession = chatSessions.find(s => s.id === activeSessionId);
  const currentMessages = activeSession?.messages || [];

  return (
    <ChatErrorBoundary>
      <div className="flex h-screen bg-gray-50">
        <ConnectionStatus isConnecting={isBotTyping} lastError={connectionError} />
        
        {/* Sidebar */}
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden flex flex-col`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-gray-800">Mindfulness Chat</h1>
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
            </div>
            <button
              onClick={handleNewChat}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-100 rounded-lg border border-gray-300 mb-4 transition-colors"
            >
              <Plus size={18} className="text-gray-700" />
              <span className="text-sm font-medium text-gray-800">Chat Baru</span>
            </button>
            
            {/* Indikator koneksi */}
            <div className="flex items-center space-x-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className={connectionError ? 'text-red-600' : 'text-green-600'}>
                {connectionError ? 'Offline' : 'Online'}
              </span>
            </div>
          </div>
          
          {/* Daftar sesi chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">Riwayat</h3>
            {chatSessions.map(session => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                  activeSessionId === session.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'hover:bg-gray-100 text-gray-700'
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

        {/* Area Chat Utama */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                title="Kembali ke Beranda"
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                <Home size={20} className="text-gray-700" />
              </button>
              {!sidebarOpen && (
                <button 
                  onClick={() => setSidebarOpen(true)} 
                  className="p-2 hover:bg-gray-200 rounded-full"
                >
                  <Menu size={20} className="text-gray-700" />
                </button>
              )}
              <h2 className="text-lg font-semibold text-gray-800">
                Mindfulness AI
              </h2>
            </div>
          </div>

          {/* Area Pesan */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <div className="max-w-3xl mx-auto space-y-6">
              {currentMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                    msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
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
                          <ReactMarkdown className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.text}
                          </ReactMarkdown>
                          {Array.isArray(msg.followUpQuestions) && msg.followUpQuestions.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-2">Pertanyaan lanjutan:</p>
                              <div className="space-y-1">
                                {msg.followUpQuestions.map((question, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleFollowUpClick(question)}
                                    className="block w-full text-left text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                                  >
                                    {question}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm whitespace-pre-line">
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs mt-1.5 px-2 ${
                    msg.sender === 'user' ? 'text-gray-400 self-end' : 'text-gray-400 self-start ml-11'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              ))}

              {/* Indikator bot mengetik */}
              {isBotTyping && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                    <span className="text-sm font-bold">M</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="animate-bounce">•</div>
                      <div className="animate-bounce delay-100">•</div>
                      <div className="animate-bounce delay-200">•</div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input Chat */}
          <div className="border-t border-gray-200 bg-white p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-3">
              <button
                type="button"
                ref={emojiPickerButtonRef}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Smile size={20} className="text-gray-600" />
              </button>
              
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerPopupRef}
                  className="absolute bottom-20 left-4 z-50"
                >
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    theme={Theme.AUTO}
                    emojiStyle={EmojiStyle.NATIVE}
                    lazyLoadEmojis={true}
                  />
                </div>
              )}
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tulis pesan..."
              />
              
              <button
                type="submit"
                disabled={!message.trim() || isBotTyping}
                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
              
              {isBotTyping && (
                <button
                  type="button"
                  onClick={() => {
                    if (abortController) {
                      abortController.abort();
                      setAbortController(null);
                      setIsBotTyping(false);
                    }
                  }}
                  className="p-2 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                  title="Batalkan jawaban"
                >
                  <XCircle size={18} />
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </ChatErrorBoundary>
  );
};

export default ChatbotPage;
