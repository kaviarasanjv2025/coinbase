import React, { useEffect, useState } from "react";

const App = () => {
  const [websocket, setWebSocket] = useState(null);
  const [subscribed, setSubscribed] = useState({});
  const [priceUpdates, setPriceUpdates] = useState({});
  const [matches, setMatches] = useState([]);
  const [subscribedChannels, setSubscribedChannels] = useState([]); 

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");
    setWebSocket(ws);
   
    ws.onopen = () => {
      console.log("WebSocket connection established!");
      const msg = {
        type: "subscribe",
        product_ids: ["BTC-USD", "ETH-USD", "XRP-USD", "LTC-USD"],
        channels: ["level2", "matches"],
      };
      ws.send(JSON.stringify(msg));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "subscriptions") {
        
        setSubscribedChannels(data.channels.map((channel) => channel.name));
      } else if (data.type === "l2update") {
        const { product_id, changes } = data;

        setPriceUpdates((prev) => {
          const updated = { ...prev };
          if (!updated[product_id]) {
            updated[product_id] = { bids: [], asks: [] };
          }
          changes.forEach(([side, price, size]) => {
            if (side === "buy") {
              updated[product_id].bids.push({ price, size });
            } else if (side === "sell") {
              updated[product_id].asks.push({ price, size });
            }
          });
          return updated;
        });
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error: ", err);
    };

    return () => ws.close();
  }, []);

  const handleSubscribe = (product) => {
    websocket.send(JSON.stringify({ type: "subscribe", product_id: product, channels: ["level2", "matches"] }));
    setSubscribed((prev) => ({ ...prev, [product]: true }));
  };

  const handleUnsubscribe = (product) => {
    websocket.send(JSON.stringify({ type: "unsubscribe", product_id: product, channels: ["level2", "matches"] }));
    setSubscribed((prev) => ({ ...prev, [product]: false }));
  };

  return (
    <div>
      <h1>Edge Water Markets Coinbase</h1>

      <h2>Subscribe/Unsubscribe</h2>
      {["BTC-USD", "ETH-USD", "XRP-USD", "LTC-USD"].map((product) => (
        <div key={product}>
          <button onClick={() => handleSubscribe(product)}>Subscribe {product}</button>
          <button onClick={() => handleUnsubscribe(product)}>Unsubscribe {product}</button>
          <p>{subscribed[product] ? "Subscribed" : "Not Subscribed"}</p>
        </div>
      ))}

      <h2>Price View</h2>
      {Object.keys(priceUpdates).map((product) => (
        <div key={product}>
          <h3>{product}</h3>
          <pre>{JSON.stringify(priceUpdates[product], null, 2)}</pre>
        </div>
      ))}

      <h2>Match View</h2>
      <table border="1">
        <thead>
          <tr>
            <th>Time</th>
            <th>Product</th>
            <th>Size</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, index) => (
            <tr key={index}>
              <td>{new Date(match.time).toLocaleTimeString()}</td>
              <td>{match.product_id}</td>
              <td>{match.size}</td>
              <td style={{ color: match.side === "buy" ? "green" : "red" }}>{match.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

     
     <div>
        <h2>System Status</h2>
        <ul>
          {subscribedChannels.length > 0 ? (
            subscribedChannels.map((channel, index) => (
              <li key={index}>{channel}</li>
            ))
          ) : (
            <p>No channels subscribed yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default App;
