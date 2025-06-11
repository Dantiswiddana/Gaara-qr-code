const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const { default: qrcode } = require('qrcode');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

app.use(express.static('public'));

async function startSocket() {
  const sock = makeWASocket({ auth: state });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;
    if (qr) {
      const qrDataURL = await qrcode.toDataURL(qr);
      io.emit('qr', qrDataURL);
    }
    if (connection === 'open') {
      console.log("✅ Connecté à WhatsApp");
      io.emit('connected', true);
    }
  });
}

startSocket();

io.on('connection', (socket) => {
  console.log('🟢 Utilisateur connecté à Socket.IO');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🌍 Serveur en ligne sur http://localhost:${PORT}`));
