import { useState, useEffect } from "react";
import { supabase } from "./supbaseClient";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, serUsername] = useState("Anon");

  async function getMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true }); // oldest first, then newest

    if (error) console.log("Error fetching history:", error);
    else setMessages(data);
  }

  async function sendMessages() {
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

  return <></>;
}

export default App;
