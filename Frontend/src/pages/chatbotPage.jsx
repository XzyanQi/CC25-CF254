import axios from 'axios';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { Home, Menu, MessageSquare, Plus, Send, Smile, Trash2, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendToMindfulness } from '../api/chatbot';

const CHAT_SESSIONS_KEY = 'mindfulnessChatSessions';

React
// Daftar kata yang dilarang 
const BANNED_WORDS = new Set([
  'kafir', 'bom', 'gay', 'lesbi', 'trans', 'transgender', 'homo', 'dick', 'iblis', 'lonte', 'pokkai',
  'agama', 'islam', 'kristen', 'buddha', 'hindu', 'konghucu', 'yahudi', 'genoshida', 'genosida', 'perang'
]);

const ChatbotPage = () => {
  const [message, setMessage] = useState('');
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerButtonRef = useRef(null);
  const emojiPickerPopupRef = useRef(null);

  const navigate = useNavigate();

  const generateUniqueId = (prefix) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  };

  // Fungsi untuk membersihkan dan memvalidasi respons bot
  const cleanBotResponse = (responseData) => {
    if (!responseData) {
      return "Maaf, tidak ada respons dari server.";
    }

    let botReplyText = "";

    // Prioritas parsing respons berdasarkan struktur yang paling umum
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
      // Handle array responses
      if (responseData.results.length > 0) {
        const firstResult = responseData.results[0];
        if (typeof firstResult === 'string') {
          botReplyText = firstResult.trim();
        } else if (firstResult && typeof firstResult.message === 'string') {
          botReplyText = firstResult.message.trim();
        } else if (firstResult && typeof firstResult.text === 'string') {
          botReplyText = firstResult.text.trim();
        } else if (firstResult && typeof firstResult.content === 'string') {
          botReplyText = firstResult.content.trim();
        } else {
          console.warn("Format results[0] tidak dikenal:", firstResult);
          botReplyText = "Format respons tidak dapat diproses.";
        }
      } else {
        botReplyText = "Respons array kosong dari server.";
      }
    } else if (responseData.choices && Array.isArray(responseData.choices)) {
      // Handle OpenAI-style responses
      if (responseData.choices.length > 0 && responseData.choices[0].message) {
        botReplyText = responseData.choices[0].message.content?.trim() || 
                      responseData.choices[0].message.text?.trim() || 
                      "Respons tidak valid dari choices.";
      } else {
        botReplyText = "Format choices tidak valid.";
      }
    } else {
      try {
        const stringified = JSON.stringify(responseData);
        console.warn("Struktur respons tidak dikenal, data:", responseData);
        botReplyText = "Format respons tidak dikenal dari server.";
      } catch (e) {
        botReplyText = "Respons tidak dapat diproses.";
      }
    }

    // Validasi dan pembersihan final
    if (!botReplyText || botReplyText.length === 0) {
      return "Maaf, respons kosong dari server.";
    }

    // Batasi panjang respons
    if (botReplyText.length > 5000) {
      botReplyText = botReplyText.substring(0, 5000) + "... (respons dipotong karena terlalu panjang)";
    }

    // Bersihkan karakter yang tidak diinginkan
    botReplyText = botReplyText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return botReplyText;
  };

  // Fungsi untuk menangani error API dengan lebih baik
  const handleApiError = (error) => {
    let errorMessage = "Oops! Terjadi kesalahan saat menghubungi server. Silakan coba lagi.";
    
    if (axios.isCancel(error)) {
      console.log('Request dibatalkan:', error.message);
      return null; // Tidak perlu menampilkan error untuk request yang dibatalkan
    } else if (error.response) {
      // Server respond eror
      const status = error.response.status;
      switch (status) {
        case 400:
          errorMessage = "Permintaan tidak valid. Silakan coba lagi.";
          break;
        case 401:
          errorMessage = "Tidak memiliki akses. Silakan login kembali.";
          break;
        case 403:
          errorMessage = "Akses ditolak oleh server.";
          break;
        case 404:
          errorMessage = "Layanan tidak ditemukan.";
          break;
        case 429:
          errorMessage = "Terlalu banyak permintaan. Silakan tunggu sebentar.";
          break;
        case 500:
          errorMessage = "Server mengalami masalah. Silakan coba lagi nanti.";
          break;
        case 503:
          errorMessage = "Layanan sedang tidak tersedia. Silakan coba lagi nanti.";
          break;
        default:
          errorMessage = `Server error (${status}). Silakan coba lagi.`;
      }
      console.error(`API Error ${status}:`, error.response.data);
    } else if (error.request) {
      // Network error
      errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      console.error('Network Error:', error.request);
    } else {
      // Lainnya
      console.error('Error:', error.message);
    }

    return errorMessage;
  };

  useEffect(() => {
    const savedSessions = localStorage.getItem(CHAT_SESSIONS_KEY);
    let loadedSessions = [];
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        loadedSessions = parsedSessions.map(session => ({
          ...session,
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })),
          lastUpdated: new Date(session.lastUpdated)
        }));
      } catch (error) {
        console.error("Error parsing chat sessions dari localStorage:", error);
      }
    }

    if (loadedSessions.length > 0) {
      loadedSessions.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
      setChatSessions(loadedSessions);
      setActiveSessionId(loadedSessions[0].id);
    } else {
       handleNewChat(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatSessions.length > 0 || localStorage.getItem(CHAT_SESSIONS_KEY)) {
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(chatSessions));
    } else if (chatSessions.length === 0 && localStorage.getItem(CHAT_SESSIONS_KEY)) {
      localStorage.removeItem(CHAT_SESSIONS_KEY);
    }
  }, [chatSessions]);
  
  const activeSession = chatSessions.find(s => s.id === activeSessionId);
  const currentMessages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]); 

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onEmojiClick = (emojiData) => {
    setMessage(prevMessage => prevMessage + emojiData.emoji);
  };

  const handleNewChat = (updateFromExistingSessions = true) => {
    const newSessionId = generateUniqueId('session');
    const initialBotMessageText = "Hello, i'm Mindfulness, your personal assistant. How can I help you today? 😊";
    const newSession = {
      id: newSessionId,
      name: `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 
      messages: [
        { 
          id: generateUniqueId('init-bot'), 
          text: initialBotMessageText,
          sender: "bot", 
          timestamp: new Date() 
        }
      ],
      lastUpdated: new Date()
    };
    if (updateFromExistingSessions) {
      setChatSessions(prevSessions => [newSession, ...prevSessions]
        .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()));
    } else {
      setChatSessions([newSession]);
    }
    setActiveSessionId(newSessionId);
    setMessage('');
    setIsBotTyping(false);
    setShowEmojiPicker(false);
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setMessage('');
    setIsBotTyping(false);
    setShowEmojiPicker(false);
  };
  
  const handleDeleteSession = (sessionIdToDelete, event) => {
    event.stopPropagation();
    const currentSessions = chatSessions.filter(session => session.id !== sessionIdToDelete);
    setChatSessions(currentSessions);
    
    if (activeSessionId === sessionIdToDelete) {
      if (currentSessions.length > 0) {
        currentSessions.sort((a,b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
        setActiveSessionId(currentSessions[0].id);
      } else {
        handleNewChat(false); 
      }
    }
  };

  const sendMessage = async () => {
    const userMessageText = message.trim();
    if (!userMessageText || !activeSessionId) return;

    const lowerCaseUserMessage = userMessageText.toLowerCase();
    const wordsInMessage = lowerCaseUserMessage.split(/[\s.,!?;:]+/).map(word => word.replace(/^[^\w]+|[^\w]+$/g, ""));
    
    let foundBannedWord = false;
    for (const word of wordsInMessage) {
      if (BANNED_WORDS.has(word) && word !== '') { 
        foundBannedWord = true;
        break;
      }
    }

    // Tambahkan pesan pengguna ke UI
    const userMessage = {
      id: generateUniqueId('user'),
      text: userMessageText,
      sender: "user",
      timestamp: new Date()
    };

    setChatSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === activeSessionId) {
          const isFirstUserMessageInSession = session.messages.filter(m => m.sender === 'user').length === 0;
          const newSessionName = isFirstUserMessageInSession 
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
      }).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
    );
    
    setMessage('');
    setShowEmojiPicker(false);

    if (foundBannedWord) {
      console.log("Banned word terdeteksi:", userMessageText);
      const botCannedResponse = {
        id: generateUniqueId('bot-banned'),
        text: "Maaf, saya tidak mengerti apa yang anda katakan.",
        sender: "bot",
        timestamp: new Date()
      };
      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, botCannedResponse], lastUpdated: new Date() }
            : session
        ).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
      );
      return;
    }

    // Setup abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const currentController = new AbortController();
    abortControllerRef.current = currentController; 
    setIsBotTyping(true);

    try {
      // Kirim request ke API dengan timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 detik timeout
      });

      const apiPromise = sendToMindfulness(userMessageText, currentController.signal);
      const botResponseData = await Promise.race([apiPromise, timeoutPromise]);
      
      // Clear abort controller jika request berhasil
      if (abortControllerRef.current === currentController) {
        abortControllerRef.current = null; 
      }

      // Proses respons dengan fungsi pembersihan yang telah diperbaiki
      const botReplyText = cleanBotResponse(botResponseData);

      const botMessage = {
        id: generateUniqueId('bot'),
        text: botReplyText,
        sender: "bot",
        timestamp: new Date()
      };

      setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, botMessage], lastUpdated: new Date() }
            : session
        ).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
      );

    } catch (error) {
      // bersihkan abort controller jika request gagal
      if (abortControllerRef.current === currentController) { 
        abortControllerRef.current = null;
      }

      // Handle error dengan fungsi yang telah diperbaiki
      const errorMessage = handleApiError(error);
      
      // Hanya tampilkan error message jika bukan canceled request
      if (errorMessage) {
        const errorBotMessage = {
          id: generateUniqueId('error'),
          text: errorMessage,
          sender: "bot",
          timestamp: new Date()
        };
        
        setChatSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === activeSessionId
              ? { ...session, messages: [...session.messages, errorBotMessage], lastUpdated: new Date() }
              : session
          ).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
        );
      }
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-800">Chatbot</h1>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 rounded">
              <Menu size={20} className="text-gray-600" />
            </button>
          </div>
          <button 
            onClick={() => handleNewChat()}
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-100 rounded-lg border border-gray-300 mb-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus size={18} className="text-gray-700" />
            <span className="text-sm font-medium text-gray-800">New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">History</h3>
          {chatSessions
            .map(session => (
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
                title="Delete chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {chatSessions.length === 0 && (
            <p className="text-xs text-gray-400 text-center px-1">No chat history yet.</p>
          )}
        </div>
      </div>

      {/* Tombol */}
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
              Mindfulness 
            </h2>
          </div>
          <div></div> 
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
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
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
                    <p className="text-sm italic">Mindfulness is typing...</p>
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
                  placeholder="Type a new message here..."
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
  );
};

export default ChatbotPage;