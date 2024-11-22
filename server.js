const express = require("express");
const WebSocket = require("ws");
const app = express();
const port = 3000;

const users = {};  


const wss = new WebSocket.Server({ noServer: true });
wss.on('headers', (headers) => {
  headers['Access-Control-Allow-Origin'] = '*';
});
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");


  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "subscribe") {
      
      users[ws.id] = data.products;
      subscribeToCoinbase(ws, data.products);
    } else if (data.type === "unsubscribe") {
      
      unsubscribeFromCoinbase(ws, data.products);
    }
  });

  
  ws.on("close", () => {
    delete users[ws.id]; 
  });
});


function subscribeToCoinbase(ws, products) {
  const coinbaseWs = new WebSocket("wss://ws-feed.pro.coinbase.com");
  coinbaseWs.on("open", () => {
    const subscribeMessage = {
      type: "subscribe",
      channels: [
        {
          name: "level2",
          product_ids: products
        },
        {
          name: "matches",
          product_ids: products
        }
      ]
    };
    coinbaseWs.send(JSON.stringify(subscribeMessage));
    console.log(`Subscribed to: ${products.join(", ")}`);
  });

  coinbaseWs.on("message", (data) => {
    const message = JSON.parse(data);
    if (message.type === "snapshot" || message.type === "l2update") {
      users[ws.id].forEach((product) => {
        ws.send(JSON.stringify({ type: "level2", product, data: message }));
      });
    } else if (message.type === "match") {
      users[ws.id].forEach((product) => {
        ws.send(JSON.stringify({ type: "match", product, data: message }));
      });
    }
  });
}

function unsubscribeFromCoinbase(ws, products) {
 const coinbaseWs = new WebSocket("wss://ws-feed.pro.coinbase.com");
  coinbaseWs.on("open", () => {
    const unsubscribeMessage = {
      type: "unsubscribe",
      channels: [
        {
          name: "level2",
          product_ids: products
        },
        {
          name: "matches",
          product_ids: products
        }
      ]
    };
    coinbaseWs.send(JSON.stringify(unsubscribeMessage));
    console.log(`Unsubscribed from: ${products.join(", ")}`);
  });
}

app.use(express.static("client/build"));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
// 2nd commit test