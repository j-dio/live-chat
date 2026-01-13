import { useState, useEffect } from "react";
import { supabase } from "./supbaseClient";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("Anon");

  async function getMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true }); // oldest first, then newest

    if (error) console.log("Error fetching history:", error);
    else setMessages(data);
  }

  async function sendMessage() {
    if (!newMessage) return;

    // we only INSERT. we do not fetch afterwards
    // the realtime listener will catch the echo
    await supabase
      .from('messages')
      .insert([{ content: newMessage, username: username }])

    setNewMessage("");  
  }

  useEffect(() => {
    // fetch initial history (so screen isn't empty)
    (async () => {
      await getMessages();
    })();

    // realtime listener for new messages
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          // LISTEN: when new row is inserted into the DB
          console.log("New signal received!", payload);
          const newRow = payload.new;

          // ACTION: add to our state
          setMessages((prevMessages) => [...prevMessages, newRow]);
        }
      )
      .subscribe();

    // cleanup: turn off the radio when we leave the page
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="chat-container">
      <h1>Live Chat</h1>

      <div className="username-input">
        <label>Username: </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="chat-window">
        {messages.map((msg) => (
          <div key={msg.id} className="message-bubble">
            <strong>{msg.username}: </strong>
            <span>{msg.content}</span>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
