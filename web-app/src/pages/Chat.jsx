import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Card,
  TextField,
  Typography,
  Paper,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import Scene from "./Scene";
import NewChatPopover from "../components/NewChatPopover";
import {
  getMyConversations,
  createConversation,
  getMessages,
  createMessage,
} from "../services/chatService";
import { io } from "socket.io-client";
import { getToken } from "../services/localStorageService";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [newChatAnchorEl, setNewChatAnchorEl] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const messageContainerRef = useRef(null); // Function to scroll to the bottom of the message container
  const scrollToBottom = useCallback(() => {
    if (messageContainerRef.current) {
      // Immediate scroll attempt
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;

      // Backup attempt with a small timeout to ensure DOM updates are complete
      setTimeout(() => {
        messageContainerRef.current.scrollTop =
          messageContainerRef.current.scrollHeight;
      }, 100);

      // Final attempt with a longer timeout
      setTimeout(() => {
        messageContainerRef.current.scrollTop =
          messageContainerRef.current.scrollHeight;
      }, 300);
    }
  }, []);

  // New chat popover handlers
  const handleNewChatClick = (event) => {
    setNewChatAnchorEl(event.currentTarget);
  };

  const handleCloseNewChat = () => {
    setNewChatAnchorEl(null);
  };

  const handleSelectNewChatUser = async (user) => {
    const response = await createConversation({
      type: "DIRECT",
      participantIds: [user.userId],
    });

    const newConversation = response?.data?.result;

    // Check if we already have a conversation with this user
    const existingConversation = conversations.find(
      (conv) => conv.id === newConversation.id
    );

    if (existingConversation) {
      // If conversation exists, just select it
      setSelectedConversation(existingConversation);
    } else {
      // Add to conversations list
      setConversations((prevConversations) => [
        newConversation,
        ...prevConversations,
      ]);

      // Select this new conversation
      setSelectedConversation(newConversation);
    }
  };

  // Fetch conversations from API
  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyConversations();
      setConversations(response?.data?.result || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to load conversations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Load conversations when component mounts
  useEffect(() => {
    fetchConversations();
  }, []);

  // Initialize with first conversation selected when available
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  // Load messages from the conversation history when a conversation is selected
  useEffect(() => {
    const fetchMessages = async (conversationId) => {
      try {
        // Check if we already have messages for this conversation
        if (!messagesMap[conversationId]) {
          const response = await getMessages(conversationId);
          if (response?.data?.result) {
            // Sort messages by createdDate to ensure chronological order
            const sortedMessages = [...response.data.result].sort(
              (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
            );

            // Update messages map with the fetched messages
            setMessagesMap((prev) => ({
              ...prev,
              [conversationId]: sortedMessages,
            }));
          }
        }

        // Mark conversation as read when selected
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv.id === conversationId ? { ...conv, unread: 0 } : conv
          )
        );
      } catch (err) {
        console.error(
          `Error fetching messages for conversation ${conversationId}:`,
          err
        );
      }
    };

    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, messagesMap]);
  const currentMessages = selectedConversation
    ? messagesMap[selectedConversation.id] || []
    : [];
  // Automatically scroll to the bottom when messages change or after sending a message
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  // Also scroll when the conversation changes
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation, scrollToBottom]);
  
  useEffect(() => {
    // Initialize socket connection
    console.log("Initializing socket connection...");

    const connectionUrl = "http://localhost:8099?token=" + getToken();

    const socket = new io(connectionUrl);
    
    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("message", (message) => {
      console.log("New message received:", message);
    });

    // Cleanup function - disconnect socket when component unmounts
    return () => {
      console.log("Disconnecting socket...");
      socket.disconnect();
    };
  }, []);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      content: message,
      timestamp: new Date().toISOString(),
      me: true,
      pending: true,
    }; // Optimistically update UI with the new message (append to the end for chronological order)
    setMessagesMap((prev) => ({
      ...prev,
      [selectedConversation.id]: [
        ...(prev[selectedConversation.id] || []),
        newMessage,
      ],
    }));

    // Update last message in conversation list
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              lastMessage: message,
              lastTimestamp: new Date().toLocaleString(),
            }
          : conv
      )
    );

    // Clear input field
    setMessage("");

    try {
      // Send message to API
      const response = await createMessage({
        conversationId: selectedConversation.id,
        message: message,
      });

      if (response?.data?.result) {
        // Replace temporary message with the one from the server
        setMessagesMap((prev) => {
          const updatedMessages = prev[selectedConversation.id].filter(
            (msg) => msg.id !== tempId
          );

          return {
            ...prev,
            [selectedConversation.id]: [
              ...updatedMessages,
              response.data.result,
            ].sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate)),
          };
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);

      // Mark message as failed
      setMessagesMap((prev) => {
        const updatedMessages = prev[selectedConversation.id].map((msg) =>
          msg.id === tempId ? { ...msg, failed: true, pending: false } : msg
        );

        return {
          ...prev,
          [selectedConversation.id]: updatedMessages,
        };
      });
    }
  };
  return (
    <Scene>
      <Card
        sx={{
          width: "100%",
          height: "calc(100vh - 64px)" /* 100vh minus header (64px) */,
          maxHeight: "100%",
          display: "flex",
          flexDirection: "row",
          mb: "-64px" /* Counteract the parent padding */,
          overflow: "hidden",
        }}
      >
        {/* Conversations List */}
        <Box
          sx={{
            width: 300,
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {" "}
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Chats</Typography>{" "}
            <IconButton
              color="primary"
              size="small"
              onClick={handleNewChatClick}
              sx={{
                bgcolor: "primary.light",
                color: "white",
                "&:hover": {
                  bgcolor: "primary.main",
                },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>{" "}
            <NewChatPopover
              anchorEl={newChatAnchorEl}
              open={Boolean(newChatAnchorEl)}
              onClose={handleCloseNewChat}
              onSelectUser={handleSelectNewChatUser}
            />
          </Box>{" "}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
            }}
          >
            {(() => {
              if (loading) {
                return (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress size={28} />
                  </Box>
                );
              }
              if (error) {
                return (
                  <Box sx={{ p: 2 }}>
                    <Alert
                      severity="error"
                      sx={{ mb: 2 }}
                      action={
                        <IconButton
                          color="inherit"
                          size="small"
                          onClick={fetchConversations}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      {error}
                    </Alert>
                  </Box>
                );
              }
              if (conversations == null || conversations.length === 0) {
                return (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography color="text.secondary">
                      No conversations yet. Start a new chat to begin.
                    </Typography>
                  </Box>
                );
              }
              return (
                <List sx={{ width: "100%" }}>
                  {conversations.map((conversation) => (
                    <React.Fragment key={conversation.id}>
                      {" "}
                      <ListItem
                        alignItems="flex-start"
                        onClick={() => handleConversationSelect(conversation)}
                        sx={{
                          cursor: "pointer",
                          bgcolor:
                            selectedConversation?.id === conversation.id
                              ? "rgba(0, 0, 0, 0.04)"
                              : "transparent",
                          "&:hover": {
                            bgcolor: "rgba(0, 0, 0, 0.08)",
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            color="error"
                            badgeContent={conversation.unread}
                            invisible={conversation.unread === 0}
                            overlap="circular"
                          >
                            <Avatar
                              src={conversation.conversationAvatar || ""}
                            />
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              display={"flex"}
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                noWrap
                                sx={{ display: "inline" }}
                              >
                                {conversation.conversationName}
                              </Typography>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: "inline", fontSize: "0.7rem" }}
                              >
                                {new Date(
                                  conversation.modifiedDate
                                ).toLocaleString("vi-VN", {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                })}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Typography
                              sx={{ display: "inline" }}
                              component="span"
                              variant="body2"
                              color="text.primary"
                              noWrap
                            >
                              {conversation.lastMessage ||
                                "Start a conversation"}
                            </Typography>
                          }
                          primaryTypographyProps={{
                            fontWeight:
                              conversation.unread > 0 ? "bold" : "normal",
                          }}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            pr: 1,
                          }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              );
            })()}
          </Box>
        </Box>

        {/* Chat Area */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {selectedConversation ? (
            <>
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Avatar
                  src={selectedConversation.conversationAvatar}
                  sx={{ mr: 2 }}
                />
                <Typography variant="h6">
                  {selectedConversation.conversationName}
                </Typography>
              </Box>{" "}
              <Box
                id="messageContainer"
                ref={messageContainerRef}
                sx={{
                  flexGrow: 1,
                  p: 2,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {" "}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    margin:
                      "auto 0 0 0" /* Push to bottom, but allow scrolling */,
                  }}
                >
                  {currentMessages.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        display: "flex",
                        justifyContent: msg.me ? "flex-end" : "flex-start",
                        mb: 2,
                      }}
                    >
                      {!msg.me && (
                        <Avatar
                          src={msg.sender?.avatar}
                          sx={{
                            mr: 1,
                            alignSelf: "flex-end",
                            width: 32,
                            height: 32,
                          }}
                        />
                      )}
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          maxWidth: "70%",
                          backgroundColor: msg.me
                            ? msg.failed
                              ? "#ffebee"
                              : "#e3f2fd"
                            : "#f5f5f5",
                          borderRadius: 2,
                          opacity: msg.pending ? 0.7 : 1,
                        }}
                      >
                        <Typography variant="body1">{msg.message}</Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent="flex-end"
                          sx={{ mt: 1 }}
                        >
                          {msg.failed && (
                            <Typography variant="caption" color="error">
                              Failed to send
                            </Typography>
                          )}
                          {msg.pending && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Sending...
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            sx={{ display: "block", textAlign: "right" }}
                          >
                            {new Date(msg.createdDate).toLocaleString()}
                          </Typography>
                        </Stack>
                      </Paper>
                      {msg.me && (
                        <Avatar
                          sx={{
                            ml: 1,
                            alignSelf: "flex-end",
                            width: 32,
                            height: 32,
                            bgcolor: "#1976d2",
                          }}
                        >
                          You
                        </Avatar>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box
                component="form"
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: "divider",
                  display: "flex",
                }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Type a message"
                  variant="outlined"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  size="small"
                />
                <IconButton
                  color="primary"
                  sx={{ ml: 1 }}
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    </Scene>
  );
}
