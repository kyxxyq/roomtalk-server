const express = require('express');
const app = express();
app.use(express.json());

let rooms = {};

// Создать комнату
app.post('/create', (req, res) => {
  const { roomId, password } = req.body;
  if (rooms[roomId]) {
    return res.json({ error: 'room exists' });
  }
  rooms[roomId] = {
    password: password,
    messages: [],
    users: 1,
    lastSeen: { 0: Date.now(), 1: Date.now() }
  };
  console.log('Room created:', roomId);
  res.json({ ok: true, userId: 0 });
});

// Войти в комнату
app.post('/join', (req, res) => {
  const { roomId, password } = req.body;
  if (!rooms[roomId]) {
    return res.json({ error: 'room not found' });
  }
  if (rooms[roomId].password !== password) {
    return res.json({ error: 'wrong password' });
  }
  let userId = rooms[roomId].users;
  rooms[roomId].users++;
  rooms[roomId].lastSeen[userId] = Date.now();
  console.log('User joined room:', roomId, 'userId:', userId);
  res.json({ ok: true, userId: userId });
});

// Отправить сообщение
app.post('/send', (req, res) => {
  const { roomId, userId, payload } = req.body;
  if (!rooms[roomId]) {
    return res.json({ error: 'room not found' });
  }
  rooms[roomId].messages.push({
    from: userId,
    payload: payload,
    time: Date.now()
  });
  rooms[roomId].lastSeen[userId] = Date.now();
  res.json({ ok: true });
});

// Получить сообщения
app.post('/check', (req, res) => {
  const { roomId, userId, lastMsg } = req.body;
  if (!rooms[roomId]) {
    return res.json({ error: 'room not found' });
  }
  rooms[roomId].lastSeen[userId] = Date.now();
  let newMsgs = rooms[roomId].messages.slice(lastMsg || 0);
  res.json({ messages: newMsgs, count: rooms[roomId].messages.length });
});

// Очистка старых комнат (каждые 5 минут)
setInterval(() => {
  let now = Date.now();
  for (let id in rooms) {
    let room = rooms[id];
    let allGone = true;
    for (let uid in room.lastSeen) {
      if (now - room.lastSeen[uid] < 300000) { // 5 минут
        allGone = false;
      }
    }
    if (allGone || (now - room.messages[room.messages.length-1]?.time > 600000 && room.users <= 1)) {
      delete rooms[id];
      console.log('Room auto-deleted:', id);
    }
  }
}, 300000);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('HTTP RoomTalk server running on port', PORT));
