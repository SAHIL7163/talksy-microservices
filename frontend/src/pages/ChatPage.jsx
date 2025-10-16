import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  SendHorizontal,
  ArrowLeft,
  Smile,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Paperclip,
  VideoIcon,
  X,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { axiosInstance } from "../lib/axios";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import { fetchFriend, fetchMessages } from "../lib/api";
import { useSockets } from "../context/SocketContext";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const themes = {
  base: {
    bg: "bg-base-100",
    chatBg: "bg-base-200",
    sender: "bg-primary text-primary-content",
    receiver: "bg-base-300 text-base-content",
    parentsender: "bg-primary text-primary-content/70",
    parentreceiver: "bg-base-300 text-base-content/70",
    parentSenderBorder: "border-l-primary/50", // linked to sender color
    parentReceiverBorder: "border-l-base-300/50", // linked to receiver color
    input: "bg-base-200 text-base-content",
    border: "border-base-300",
    inputRing: "focus:ring-primary",
    sendBtn: "bg-primary text-primary-content hover:bg-primary-focus",
    headerBg: "bg-slate-200",
    headerBorder: "border-slate-300",
    headerText: "text-slate-800",
    menuIcon: "text-gray-500",
    filePreview: "bg-base-100 border-base-300",
    fileIcon: "text-gray-600",
    menuBg: "bg-white",
    menuHover: "hover:bg-gray-100",
    menuText: "text-gray-800",
    menuBorder: "border-gray-200",
    menuArrow: "border-gray-200",
  },
  dark: {
    bg: "bg-[#111b21]",
    chatBg: "bg-[#222e35]",
    sender: "bg-[#005c4b] text-white",
    receiver: "bg-[#202c33] text-white",
    parentsender: "bg-[#005c4b]/70 text-white",
    parentreceiver: "bg-[#202c33]/70 text-white",
    parentSenderBorder: "border-l-[#005c4b]/50", // follows sender
    parentReceiverBorder: "border-l-[#202c33]/50", // follows receiver
    input: "bg-[#2a3942] text-white",
    border: "border-[#222e35]",
    inputRing: "focus:ring-[#25d366]",
    sendBtn: "bg-[#25d366] text-white hover:bg-[#128c7e]",
    headerBg: "bg-gray-800",
    headerBorder: "border-gray-600",
    headerText: "text-gray-200",
    menuIcon: "text-gray-300",
    filePreview: "bg-[#2a3942] border-[#3b4a54]",
    fileIcon: "text-gray-300",
    menuBg: "bg-[#2a3942]",
    menuHover: "hover:bg-[#3b4a54]",
    menuText: "text-gray-200",
    menuBorder: "border-[#3b4a54]",
    menuArrow: "border-[#2a3942]",
  },
  light: {
    bg: "bg-[#f0f2f5]",
    chatBg: "bg-white",
    sender: "bg-[#d9fdd3] text-black",
    receiver: "bg-white text-black border border-gray-200",
    parentsender: "bg-[#d9fdd3]/70 text-black",
    parentreceiver: "bg-white/70 text-black",
    parentSenderBorder: "border-l-[#d9fdd3]/50", // linked to sender
    parentReceiverBorder: "border-l-gray-200/50", // linked to receiver
    input: "bg-white text-black",
    border: "border-gray-200",
    inputRing: "focus:ring-[#25d366]",
    sendBtn: "bg-[#25d366] text-white hover:bg-[#128c7e]",
    headerBg: "bg-gray-50",
    headerBorder: "border-gray-200",
    headerText: "text-gray-800",
    menuIcon: "text-gray-600",
    filePreview: "bg-gray-50 border-gray-200",
    fileIcon: "text-gray-600",
    menuBg: "bg-white",
    menuHover: "hover:bg-gray-100",
    menuText: "text-gray-800",
    menuBorder: "border-gray-200",
    menuArrow: "border-gray-200",
  },
};

export default function ChatPage() {
  const { chatSocket } = useSockets();
  const { authUser } = useAuthUser();
  const { id: targetUserId } = useParams();
  const [friendUser, setFriendUser] = useState(null);
  const { theme: currentTheme } = useThemeStore();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showJitsi, setShowJitsi] = useState(false);
  const [showCallBanner, setShowCallBanner] = useState(false);

  const messagesEndRef = useRef();
  const typingTimeout = useRef(null);
  const emojiPickerRef = useRef(null);
  const menuRef = useRef(null);
  const messageRefs = useRef({});
  const fileInputRef = useRef(null);

  const channelId = [authUser._id, targetUserId].sort().join("-");

  useEffect(() => {
    if (!channelId) return;

    const handlefetchFriend = async () => {
      try {
        const data = await fetchFriend(targetUserId);
        setFriendUser(data);
      } catch (err) {
        console.error("Error fetching friend data:", err);
      }
    };

    const handlefetchMessages = async () => {
      try {
        const data = await fetchMessages(channelId);
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    handlefetchFriend();
    handlefetchMessages();

    chatSocket.emit("join_room", channelId);

    chatSocket.on("receive_message", (msg) => {
      console.log("Received message:", msg);
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.tempId === msg.tempId);
        if (index !== -1) {
          console.log("Replacing temp message with server message");
          const updated = [...prev];
          updated[index] = msg;
          return updated;
        } else {
          console.log("Adding new message");
          return [...prev, msg];
        }
      });
    });

    chatSocket.on("typing", ({ userId }) => {
      if (userId !== authUser._id) setIsFriendTyping(true);
    });
    chatSocket.on("stop_typing", ({ userId }) => {
      if (userId !== authUser._id) setIsFriendTyping(false);
    });

    chatSocket.on("message_deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    chatSocket.on("message_edited", ({ messageId, text }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, text, isEdited: true } : msg
        )
      );
    });

    chatSocket.on("message_read", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    return () => {
      chatSocket.off("receive_message");
      chatSocket.off("typing");
      chatSocket.off("stop_typing");
      chatSocket.off("message_deleted");
      chatSocket.off("message_edited");
      chatSocket.off("message_read");
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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            const message = messages.find((msg) => msg._id === messageId);

            if (
              message &&
              message.sender._id !== authUser._id &&
              !message.isRead &&
              messageId
            ) {
              try {
                chatSocket.emit("message_read", { messageId, channelId });
              } catch (err) {
                console.error("Error marking message as read:", err);
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    Object.values(messageRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      Object.values(messageRefs.current).forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [messages, authUser._id, channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    chatSocket.on("start_video_call", ({ channelId: incomingChannelId }) => {
      if (incomingChannelId === channelId) {
        setShowCallBanner(true);
        setShowJitsi(true);
      }
    });
    chatSocket.on("end_video_call", ({ channelId: incomingChannelId }) => {
      if (incomingChannelId === channelId) {
        setShowJitsi(false);
        setShowCallBanner(false);
      }
    });
    return () => {
      chatSocket.off("start_video_call");
    };
  }, [channelId]);

  const handleEndCall = () => {
    setShowJitsi(false);
    setShowCallBanner(false);
    chatSocket.emit("end_video_call", { channelId, targetUserId });
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      chatSocket.emit("delete_message", { messageId, channelId });
      setMenuOpen(null);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) return;
    try {
      chatSocket.emit("edit_message", { messageId, channelId, text: editText });
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, text: editText, isEdited: true }
            : msg
        )
      );
      setEditingMessageId(null);
      setEditText("");
      setMenuOpen(null);
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleReplyMessage = (message) => {
    setReplyingTo(message);
    setMenuOpen(null);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return;

    const messageData = {
      channelId,
      sender: {
        _id: authUser._id,
        fullName: authUser.fullName,
        profilePic: authUser.profilePic,
      },
      text: messageText || "",
      isRead: false,
      parentMessage: replyingTo
        ? {
            _id: replyingTo._id,
            text: replyingTo.text,
            sender: {
              _id: replyingTo.sender._id,
              fullName: replyingTo.sender.fullName,
              profilePic: replyingTo.sender.profilePic,
            },
            file: replyingTo.file || null,
          }
        : null,
      tempId: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    if (selectedFile) {
      try {
        const { data } = await axiosInstance.post(
          "chat/message/s3/generate-upload-url",
          {
            filename: selectedFile.name,
            contentType: selectedFile.type,
          }
        );

        const { uploadUrl, downloadUrl } = data;

        await axios.put(uploadUrl, selectedFile, {
          headers: { "Content-Type": selectedFile.type },
        });

        messageData.file = {
          url: downloadUrl,
          type: selectedFile.type,
          name: selectedFile.name,
        };
        setSelectedFile(null);
        fileInputRef.current.value = null;
      } catch (err) {
        console.error("Error uploading file:", err);
        setSelectedFile(null);
        fileInputRef.current.value = null;
        return;
      }
    }

    setMessages((prev) => [...prev, messageData]);
    chatSocket.emit("send_message", messageData);
    setMessageText("");
    setShowInputEmoji(false);
    setReplyingTo(null);
    chatSocket.emit("stop_typing", { channelId, userId: authUser._id });
  };

  const handleTyping = () => {
    chatSocket.emit("typing", { channelId, userId: authUser._id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(
      () => chatSocket.emit("stop_typing", { channelId, userId: authUser._id }),
      1500
    );
  };

  const handleCallUser = async () => {
    setShowJitsi(true);
    setShowCallBanner(true);
    chatSocket.emit("start_video_call", { channelId, targetUserId });
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith("image/")) return "🖼️";
    if (fileType?.startsWith("application/pdf")) return "📄";
    if (fileType?.startsWith("audio/")) return "🎵";
    return "📎";
  };

  const theme = themes[currentTheme] || themes.base;

  return (
    <div
      className={`w-full min-h-[100dvh] flex flex-col ${theme.bg} font-sans`}
    >
      {/* Header */}
      <header
        className={`fixed top-25 left-0 right-0 z-40 px-4 py-3 ${theme.headerBg} ${theme.headerBorder} border-b shadow-sm`}
      >
        <div className="flex items-center justify-between max-w-full gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => window.history.back()} className="md:hidden">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            {friendUser?.user?.profilePic && (
              <img
                src={friendUser.user.profilePic}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-gray-300"
              />
            )}
            <h2
              className={`text-base sm:text-lg font-semibold ${theme.headerText}`}
            >
              {friendUser?.user?.fullName}
              {isFriendTyping && (
                <span className="ml-2 text-xs italic text-gray-500">
                  typing...
                </span>
              )}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCallUser}
              className="p-2 rounded-full hover:bg-gray-200"
            >
              <Video />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main
        className={`flex-1 px-4 sm:px-5 py-5 mt-[58px] mb-[60px] overflow-y-auto ${theme.chatBg}`}
      >
        {messages.length === 0 && (
          <p className="text-gray-400 italic text-center">No messages yet</p>
        )}
        <div className="flex flex-col gap-2">
          {messages.map((msg) => {
            const isSender = msg.sender._id === authUser._id;
            return (
              <div
                key={msg?._id || msg.tempId}
                ref={(el) => (messageRefs.current[msg._id] = el)}
                data-message-id={msg._id}
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
                    className={`relative px-3 sm:px-4 pb-2 shadow ${
                      isSender
                        ? `${theme.sender} rounded-t-2xl rounded-bl-2xl`
                        : `${theme.receiver} rounded-t-2xl rounded-br-2xl`
                    }`}
                  >
                    <div className="flex flex-col">
                      {msg.parentMessage && (
                        <div
                          className={`px-3 py-2 rounded-t-2xl rounded-b-none cursor-pointer ${
                            msg.parentMessage?.sender?._id === authUser._id
                              ? `${theme.parentsender} border-l-4 border-l-${theme.parentSenderBorder}`
                              : `${theme.parentreceiver} border-l-4 border-l-${theme.parentReceiverBorder}`
                          } -mx-3 sm:-mx-4 border-b border-gray-300 shadow-sm`}
                          onClick={() => {
                            const parentMsgRef =
                              messageRefs.current[msg.parentMessage._id];
                            if (parentMsgRef) {
                              parentMsgRef.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                              const shadowClass =
                                msg.parentMessage.sender._id === authUser._id
                                  ? `shadow-[0_0_2px] ${theme.sender.replace(
                                      "bg-",
                                      "shadow-"
                                    )}/60`
                                  : `shadow-[0_0_2px] ${theme.receiver.replace(
                                      "bg-",
                                      "shadow-"
                                    )}/60`;
                              parentMsgRef.classList.add(
                                ...shadowClass.split(" ")
                              );
                              setTimeout(
                                () =>
                                  parentMsgRef.classList.remove(
                                    ...shadowClass.split(" ")
                                  ),
                                2000
                              );
                            }
                          }}
                        >
                          <span className="text-xs italic text-gray-600 block">
                            Replying to:
                          </span>
                          {msg.parentMessage.file ? (
                            <div className="flex items-center gap-2">
                              {msg.parentMessage.file.type?.startsWith(
                                "image/"
                              ) ? (
                                <img
                                  src={msg.parentMessage.file.url}
                                  alt={
                                    msg.parentMessage.file.name ||
                                    "Parent image"
                                  }
                                  className="w-10 h-10 rounded object-cover"
                                />
                              ) : (
                                <span className={`text-sm ${theme.headerText}`}>
                                  {getFileIcon(msg.parentMessage.file.type)}
                                </span>
                              )}
                            </div>
                          ) : null}
                          {msg.parentMessage.text ? (
                            <div className="text-sm truncate">
                              {msg.parentMessage.text}
                            </div>
                          ) : !msg.parentMessage.file ? (
                            <div className="text-sm italic text-gray-500">
                              No content
                            </div>
                          ) : null}
                        </div>
                      )}
                      {editingMessageId === msg._id ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className={`flex-1 p-2 rounded border ${theme.border} ${theme.input} focus:outline-none ${theme.inputRing} min-h-[40px]`}
                            autoFocus
                          />
                          <button
                            onClick={() => handleEditMessage(msg._id)}
                            className={`px-2 py-1 ${theme.sendBtn} rounded min-h-[40px]`}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditText("");
                            }}
                            className="px-2 py-1 bg-gray-300 text-black rounded min-h-[40px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {msg.file ? (
                            <div>
                              {msg.file.type?.startsWith("image/") ? (
                                <div className="relative group/image">
                                  <img
                                    src={msg.file.url}
                                    alt={msg.file.name || "Uploaded image"}
                                    className={`w-full max-w-[200px] max-h-[200px] rounded-lg object-contain border ${theme.border}`}
                                    onError={(e) =>
                                      console.error("Image load error:", e)
                                    }
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-30 transition-opacity duration-200 rounded-lg flex items-end justify-end p-2">
                                    <a
                                      href={msg.file.url}
                                      download={msg.file.name || "image"}
                                      className={`px-3 py-1 rounded text-sm font-medium ${theme.sendBtn} opacity-0 group-hover/image:opacity-100 transition-opacity duration-200`}
                                      title="Download image"
                                    >
                                      Download
                                    </a>
                                  </div>
                                  {/* <span className="text-xs text-gray-400 mt-1">{msg.file.name}</span> */}
                                </div>
                              ) : msg.file.type?.startsWith(
                                  "application/pdf"
                                ) ? (
                                <div className="relative group/pdf flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-sm ${theme.headerText}`}
                                    >
                                      📄 {msg.file.name || "Document.pdf"}
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <iframe
                                      src={`${msg.file.url}#toolbar=0`}
                                      className={`w-full max-w-[200px] h-[200px] rounded-lg border ${theme.border}`}
                                      title="PDF Preview"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/pdf:bg-opacity-30 transition-opacity duration-200 rounded-lg flex items-end justify-end p-2">
                                      <a
                                        href={msg.file.url}
                                        download={
                                          msg.file.name || "document.pdf"
                                        }
                                        className={`px-3 py-1 rounded text-sm font-medium ${theme.sendBtn} opacity-0 group-hover/pdf:opacity-100 transition-opacity duration-200`}
                                        title="Download PDF"
                                      >
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ) : msg.file.type?.startsWith("audio/") ? (
                                <audio
                                  src={msg.file.url}
                                  controls
                                  className={`w-full min-w-[250px] rounded-lg`}
                                  onError={(e) =>
                                    console.error("Audio load error:", e)
                                  }
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm ${theme.headerText}`}
                                  >
                                    {getFileIcon(msg.file.type)}{" "}
                                    {msg.file.name || "File"}
                                  </span>
                                  <a
                                    href={msg.file.url}
                                    download={msg.file.name || "file"}
                                    className={`px-3 py-1 rounded text-sm font-medium ${theme.sendBtn}`}
                                    title="Download file"
                                  >
                                    Download
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : null}
                          {msg.text && (
                            <div className="whitespace-pre-wrap">
                              {msg.text}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-end items-center mt-1 text-xs text-gray-400 gap-1">
                        {msg.isEdited && <span className="italic">Edited</span>}
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {isSender && (
                          <span>
                            {msg.isRead ? (
                              <CheckCheck className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Check className="w-4 h-4 text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="relative self-start mt-2">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === msg._id ? null : msg._id)
                      }
                      className={`p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                        isSender ? "mr-2" : "ml-2"
                      }`}
                    >
                      <MoreVertical className={`w-4 h-4 ${theme.menuIcon}`} />
                    </button>
                    {menuOpen === msg._id && (
                      <div
                        ref={menuRef}
                        className={`absolute ${
                          isSender ? "-right-20" : "-left-20"
                        } top-0 z-20 ${theme.menuBg} border ${
                          theme.menuBorder
                        } shadow-lg rounded-lg min-w-[150px] py-2 transition-all duration-200 ease-in-out transform ${
                          menuOpen === msg._id
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2"
                        } before:content-[''] before:absolute before:-top-2 before:${
                          isSender ? "right-2" : "left-2"
                        } before:w-4 before:h-4 before:bg-[${
                          theme.menuBg === "bg-white"
                            ? "#ffffff"
                            : theme.menuBg.replace("bg-", "#")
                        }]`}
                      >
                        <button
                          onClick={() => handleReplyMessage(msg)}
                          className={`block w-full text-left px-4 py-2 ${theme.menuText} ${theme.menuHover} text-sm font-medium`}
                        >
                          Reply
                        </button>
                        {isSender && msg.text && !msg.file && (
                          <button
                            onClick={() => {
                              setEditingMessageId(msg._id);
                              setEditText(msg.text);
                              setMenuOpen(null);
                            }}
                            className={`block w-full text-left px-4 py-2 ${theme.menuText} ${theme.menuHover} text-sm font-medium`}
                          >
                            Edit
                          </button>
                        )}
                        {isSender && msg.text && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className={`block w-full text-left px-4 py-2 ${theme.menuText} ${theme.menuHover} text-red-600 text-sm font-medium`}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {showCallBanner && !showJitsi && (
        <div className="flex justify-center my-2">
          <button
            onClick={() => setShowJitsi(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
          >
            <VideoIcon className="w-5 h-5" />
            Join Video Call
          </button>
        </div>
      )}

      {showJitsi && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative w-full max-w-2xl h-[70vh] bg-white rounded-lg shadow-lg">
            <button
              onClick={handleEndCall}
              className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded"
            >
              End Call
            </button>
            <iframe
              src={`https://meet.jit.si/streamify-${channelId}`}
              style={{
                width: "100%",
                height: "100%",
                border: 0,
                borderRadius: "8px",
              }}
              allow="camera; microphone; fullscreen; display-capture"
              title="Jitsi Video Call"
            />
          </div>
        </div>
      )}

      <footer
        className={`fixed bottom-0 left-0 right-0 p-3 z-50 border-t ${theme.border} ${theme.chatBg} flex flex-col gap-2`}
      >
        {replyingTo && (
          <div
            className={`flex items-center justify-between ${
              replyingTo.sender._id === authUser._id
                ? theme.sender
                : theme.receiver
            } p-2 rounded`}
          >
            <span className="text-sm italic">
              Replying to: {replyingTo.text}
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-red-500"
            >
              Cancel
            </button>
          </div>
        )}
        {selectedFile && (
          <div
            className={`flex items-center justify-between p-2 rounded border ${theme.filePreview}`}
          >
            <span className={`text-sm ${theme.headerText}`}>
              {getFileIcon(selectedFile.type)} {selectedFile.name}
            </span>
            <button
              onClick={() => {
                setSelectedFile(null);
                fileInputRef.current.value = null;
              }}
              className="text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
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
          <button
            onClick={() => fileInputRef.current.click()}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf,audio/*"
            className="hidden"
          />
          <input
            value={messageText}
            type="text"
            placeholder="Type your message"
            className={`flex-1 p-2 sm:p-3 rounded-full border ${theme.border} ${theme.input} focus:outline-none ${theme.inputRing}`}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
          />
          <button
            onClick={handleSendMessage}
            className={`rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${theme.sendBtn}`}
          >
            <SendHorizontal className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </footer>
    </div>
  );
}
