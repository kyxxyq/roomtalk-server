const WebSocket = require('ws');
const server = require('http').createServer();
const wss = new WebSocket.Server({ server });

let rooms = {};

wss.on('connection', (ws) => {
  let myRoom = null;

  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch(e) { return; }

    if (data.cmd === 'create') {
      const roomId = data.roomId;
      const password = data.password;
      if (!rooms[roomId]) {
        rooms[roomId] = { clients: [], password: password };
      }
      if (rooms[roomId].password === password) {
        rooms[roomId].clients.push(ws);
        myRoom = roomId;
        ws.send(JSON.stringify({ type: 'system', text: 'joined' }));
      } else {
        ws.send(JSON.stringify({ type: 'error', text: 'wrong password' }));
      }
    }

    if (data.cmd === 'join') {
      const roomId = data.roomId;
      const password = data.password;
      if (rooms[roomId] && rooms[roomId].password === password) {
        rooms[roomId].clients.push(ws);
        myRoom = roomId;
        ws.send(JSON.stringify({ type: 'system', text: 'joined' }));
        rooms[roomId].clients.forEach(c => {
          if (c !== ws) c.send(JSON.stringify({ type: 'system', text: 'user joined' }));
        });
      } else {
        ws.send(JSON.stringify({ type: 'error', text: 'wrong room or password' }));
      }
    }

    if (data.cmd === 'msg') {
      if (myRoom && rooms[myRoom]) {
        rooms[myRoom].clients.forEach(c => {
          if (c !== ws) c.send(JSON.stringify({ type: 'msg', payload: data.payload }));
        });
      }
    }
  });

  ws.on('close', () => {
    if (myRoom && rooms[myRoom]) {
      rooms[myRoom].clients = rooms[myRoom].clients.filter(c => c !== ws);
      if (rooms[myRoom].clients.length === 0) {
        delete rooms[myRoom];
      }
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('Server running'));
