import { useState, useEffect } from "react";
import { supabase } from "./supbaseClient";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // fetch initial history (so screen isn't empty)
    // getMessages()

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
      );
  });
  return <></>;
}

export default App;
