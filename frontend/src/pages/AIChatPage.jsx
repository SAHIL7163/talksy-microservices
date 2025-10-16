import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  SendHorizontal,
  ArrowLeft,
  Smile,
  Video,
  MoreVertical,
  Cpu,
  CheckCheck,
} from "lucide-react";

import { useThemeStore } from "../store/useThemeStore";
import { axiosInstance } from "../lib/axios";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import { DeleteMessage, fetchMessages } from "../lib/api";
import { useSockets } from "../context/SocketContext";

const themes = {
  base: {
    bg: "bg-base-100",
    chatBg: "bg-base-200",
    sender: "bg-primary text-primary-content",
    receiver: "bg-base-300 text-base-content",
    parentsender: "bg-primary text-primary-content/70", // 70% opacity for contrast
    parentreceiver: "bg-base-300 text-base-content/70",
    input: "bg-base-200 text-base-content",
    border: "border-base-300",
    inputRing: "focus:ring-primary",
    sendBtn: "bg-primary text-primary-content hover:bg-primary-focus",
    headerBg: "bg-slate-200",
    headerBorder: "border-slate-300",
    headerText: "text-slate-800",
    menuIcon: "text-gray-500",
  },
  dark: {
    bg: "bg-[#111b21]",
    chatBg: "bg-[#222e35]",
    sender: "bg-[#005c4b] text-white",
    receiver: "bg-[#202c33] text-white",
    parentsender: "bg-[#005c4b]/70 text-white bottom-border",
    parentreceiver: "bg-[#202c33]/70 text-white",
    input: "bg-[#2a3942] text-white",
    border: "border-[#222e35]",
    inputRing: "focus:ring-[#25d366]",
    sendBtn: "bg-[#25d366] text-white hover:bg-[#128c7e]",
    headerBg: "bg-gray-800",
    headerBorder: "border-gray-600",
    headerText: "text-gray-200",
    menuIcon: "text-gray-300",
  },
  light: {
    bg: "bg-[#f0f2f5]",
    chatBg: "bg-white",
    sender: "bg-[#d9fdd3] text-black",
    receiver: "bg-white text-black border border-gray-200",
    parentsender: "bg-[#d9fdd3]/70 text-black",
    parentreceiver: "bg-white/70 text-black",
    input: "bg-white text-black",
    border: "border-gray-200",
    inputRing: "focus:ring-[#25d366]",
    sendBtn: "bg-[#25d366] text-white hover:bg-[#128c7e]",
    headerBg: "bg-gray-50",
    headerBorder: "border-gray-200",
    headerText: "text-gray-800",
    menuIcon: "text-gray-600",
  },
};

export default function AIChatPage() {
  const { chatSocket } = useSockets();
  const { authUser } = useAuthUser();
  const { theme: currentTheme } = useThemeStore();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  const messagesEndRef = useRef();
  const emojiPickerRef = useRef(null);
  const menuRef = useRef(null);

  const channelId = `ai-${authUser._id}`;

  const handleReceiveAIMessage = useCallback(
    (message) => {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, message]);
    },
    [chatSocket, channelId]
  );

  useEffect(() => {
    if (!channelId) return;

    const handlefetchMessages = async () => {
      try {
        const data = await fetchMessages(channelId);
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    handlefetchMessages();

    chatSocket.emit("join_room", channelId);

    chatSocket.on("receive_ai_message", handleReceiveAIMessage);

    chatSocket.on("message_edited", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    return () => {
      chatSocket.off("receive_ai_message", handleReceiveAIMessage);
      chatSocket.off("message_deleted");
      chatSocket.off("message_edited");
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowInputEmoji(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDeleteMessage = async (messageId) => {
    try {
      await DeleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      setMenuOpen(null);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) return;
    try {
      await axiosInstance.put(`/chat/message/${messageId}`, { text: editText });
      setMessages((prev) =>
        prev.map((msg) => {
          return msg._id === messageId
            ? { ...msg, text: editText, isEdited: true }
            : msg;
        })
      );
      setEditingMessageId(null);
      setEditText("");
      setMenuOpen(null);
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    const messageData = { channelId, senderId: authUser._id, text };
    chatSocket.emit("send_ai_message", messageData);
    setMessages((prev) => [
      ...prev,
      { ...messageData, _id: Date.now(), sender: authUser },
    ]);
    setMessageText("");
    setShowInputEmoji(false);
  };

  const theme = themes[currentTheme] || themes.base;
  return (
    <div
      className={`w-full min-h-[100dvh] flex flex-col ${theme.bg} font-sans`}
    >
      {/* Header */}
      <header
        className={`fixed top-35 left-0 right-0 z-40 px-4 py-3 ${theme.headerBg} ${theme.headerBorder} border-b shadow-sm`}
      >
        <div className="flex items-center justify-between max-w-full gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => window.history.back()} className="md:hidden">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <Cpu className="w-6 h-6 text-gray-500" /> {/* AI avatar/icon */}
            <h2
              className={`text-base sm:text-lg font-semibold ${theme.headerText}`}
            >
              AI ASSISTANT
            </h2>
          </div>
          <div className="flex gap-2"></div>
        </div>
      </header>

      {/* Messages */}

      <main
        className={`flex-1 px-4 sm:px-5 py-5 mt-[50px] mb-[60px] ${theme.chatBg}`}
      >
        {messages.length === 0 && (
          <p className="text-gray-400 italic text-center">No messages yet</p>
        )}
        <div className="flex flex-col gap-2">
          {messages.map((msg) => {
            const isSender = msg.sender.fullName === authUser.fullName;
            return (
              <div
                key={msg._id}
                className={`flex ${
                  isSender ? "justify-end" : "justify-start"
                } w-full group`}
              >
                <div
                  className={`relative flex items-center ${
                    isSender ? "flex-row-reverse" : "flex-row"
                  } gap-1 max-w-full sm:max-w-[70%]`}
                >
                  <div
                    style={{
                      "--sender-bg": theme.senderColor,
                      "--receiver-bg": theme.receiverColor,
                    }}
                    className={`relative px-3 sm:px-4 py-2 shadow 
                    ${
                      isSender
                        ? `${theme.sender} rounded-t-2xl rounded-bl-2xl  `
                        : `${theme.receiver} rounded-t-2xl rounded-br-2xl`
                    }`}
                  >
                    {editingMessageId === msg._id ? (
                      <div className="flex gap-2">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className={`flex-1 p-2 rounded border ${theme.border} ${theme.input} focus:outline-none ${theme.inputRing}`}
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditMessage(msg._id)}
                          className={`px-2 py-1 ${theme.sendBtn} rounded`}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditText("");
                          }}
                          className="px-2 py-1 bg-gray-300 text-black rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`p-2 mb-2 rounded ${
                          isSender ? theme.parentsender : theme.parentreceiver
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <div
                          className={`flex items-center mt-1 text-xs text-gray-400 gap-1 ${
                            isSender ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>
                            {msg.createdAt && !isNaN(new Date(msg.createdAt))
                              ? new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : new Date().toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                          </span>
                          {isSender && (
                            <span>
                              <CheckCheck className="w-4 h-4 text-blue-500" />
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === msg._id ? null : msg._id)
                    }
                    className={`p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isSender ? "mr-1" : "ml-1"
                    } self-start mt-2`}
                  >
                    <MoreVertical className={`w-4 h-4 ${theme.menuIcon}`} />
                  </button>
                  {menuOpen === msg._id && (
                    <div
                      ref={menuRef}
                      className={`absolute ${
                        isSender ? "right-6" : "left-6"
                      } top-0 mt-1 z-50 bg-white border ${
                        theme.border
                      } shadow-lg rounded-lg min-w-[120px]`}
                    >
                      {isSender && msg.text && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                        >
                          Delete
                        </button>
                      )}
                      {isSender && msg.text && !msg.file && (
                        <button
                          onClick={() => {
                            setEditingMessageId(msg._id);
                            setEditText(msg.text);
                            setMenuOpen(null);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`fixed bottom-0 left-0 right-0 p-3 border-t ${theme.border} ${theme.chatBg} flex flex-col gap-2`}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInputEmoji((prev) => !prev);
              }}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <Smile className="w-5 h-5 text-gray-500" />
            </button>
            {showInputEmoji && (
              <div
                ref={emojiPickerRef}
                className="absolute -top-[450px] left-0 z-50 emoji-picker"
                onClick={(e) => e.stopPropagation()}
              >
                <Picker
                  data={emojiData}
                  onEmojiSelect={(emoji) =>
                    setMessageText((prev) => prev + emoji.native)
                  }
                />
              </div>
            )}
          </div>

          <input
            value={messageText}
            type="text"
            placeholder="Type your message"
            className={`flex-1 p-2 sm:p-3 rounded-full border ${theme.border} ${theme.input} focus:outline-none ${theme.inputRing}`}
            onChange={(e) => {
              setMessageText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage(messageText);
            }}
          />
          <button
            onClick={() => handleSendMessage(messageText)}
            className={`rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${theme.sendBtn}`}
          >
            <SendHorizontal className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </footer>
    </div>
  );
}
