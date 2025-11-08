import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./employer-dashboard.css";

const MessagesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockConversations = [
          {
            id: 1,
            candidateId: 1,
            candidateName: "Thato Molise",
            candidateRole: "Senior Developer",
            lastMessage: "Looking forward to the technical interview tomorrow!",
            timestamp: "2 hours ago",
            unread: true,
            avatar: "TM",
          },
          {
            id: 2,
            candidateId: 2,
            candidateName: "Lerato Mokoena",
            candidateRole: "Product Manager",
            lastMessage:
              "Thank you for the offer! I have some questions about the benefits package.",
            timestamp: "1 day ago",
            unread: false,
            avatar: "LM",
          },
          {
            id: 3,
            candidateId: 3,
            candidateName: "Mpho Sebata",
            candidateRole: "Data Analyst",
            lastMessage: "I've completed the technical assessment.",
            timestamp: "2 days ago",
            unread: false,
            avatar: "MS",
          },
          {
            id: 4,
            candidateId: 4,
            candidateName: "Kabelo Nkosi",
            candidateRole: "UX Designer",
            lastMessage: "When can I expect feedback on my portfolio review?",
            timestamp: "3 days ago",
            unread: true,
            avatar: "KN",
          },
        ];
        setConversations(mockConversations);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setIsLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId) => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockMessages = {
          id: conversationId,
          candidateId: 1,
          candidateName: "Thato Molise",
          candidateRole: "Senior Developer",
          messages: [
            {
              id: 1,
              sender: "candidate",
              content: "Hello! Thank you for considering my application.",
              timestamp: "2024-01-10T10:00:00",
            },
            {
              id: 2,
              sender: "employer",
              content:
                "Hi Thato! We're impressed with your background. Would you be available for an interview next week?",
              timestamp: "2024-01-10T10:05:00",
            },
            {
              id: 3,
              sender: "candidate",
              content:
                "Absolutely! I'm available Tuesday or Wednesday afternoon.",
              timestamp: "2024-01-10T10:10:00",
            },
            {
              id: 4,
              sender: "employer",
              content:
                "Great! Let's schedule for Tuesday at 2 PM. I'll send the calendar invite.",
              timestamp: "2024-01-10T10:15:00",
            },
            {
              id: 5,
              sender: "candidate",
              content: "Looking forward to the technical interview tomorrow!",
              timestamp: "2024-01-14T16:30:00",
            },
          ],
        };
        setSelectedConversation(mockMessages);
      }, 500);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      id: selectedConversation.messages.length + 1,
      sender: "employer",
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    setSelectedConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));

    setNewMessage("");
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.candidateRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="messages-list loading">
        <div className="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="messages-list">
      <div className="page-header">
        <h1>Candidate Messages</h1>
        <p>Communicate with your candidates</p>
      </div>

      <div className="messages-container">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="conversations-list">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  selectedConversation?.id === conversation.id ? "active" : ""
                }`}
                onClick={() => loadConversationMessages(conversation.id)}
              >
                <div className="conversation-avatar">{conversation.avatar}</div>
                <div className="conversation-content">
                  <div className="conversation-header">
                    <h4>{conversation.candidateName}</h4>
                    <span className="conversation-time">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p className="conversation-preview">
                    {conversation.lastMessage}
                  </p>
                  <span className="candidate-role">
                    {conversation.candidateRole}
                  </span>
                </div>
                {conversation.unread && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message Area */}
        <div className="message-area">
          {selectedConversation ? (
            <>
              <div className="message-header">
                <div className="candidate-info">
                  <div className="candidate-avatar">
                    {selectedConversation.candidateName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3>{selectedConversation.candidateName}</h3>
                    <p>{selectedConversation.candidateRole}</p>
                  </div>
                </div>
                <div className="header-actions">
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      navigate(
                        `/dashboard/employer/candidates/${selectedConversation.candidateId}`
                      )
                    }
                  >
                    View Profile
                  </button>
                  <button className="btn-secondary">Schedule Interview</button>
                </div>
              </div>

              <div className="messages-display">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${
                      message.sender === "employer" ? "outgoing" : "incoming"
                    }`}
                  >
                    <div className="message-content">
                      <p>{message.content}</p>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="message-input-area">
                <div className="message-input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <button
                    className="btn-send"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="placeholder-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a candidate from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesList;
