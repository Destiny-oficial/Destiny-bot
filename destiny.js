const { default: makeWASocket, useSingleFileAuthState } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const { unlinkSync } = require('fs');

// Utiliza un archivo de sesión para guardar la autenticación
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Conexión cerrada. ¿Intentando reconectar?', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Conectado exitosamente a WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async (msg) => {
        console.log('Mensaje recibido', JSON.stringify(msg, null, 2));
        if (msg.messages[0].message.conversation === '!ping') {
            await sock.sendMessage(msg.messages[0].key.remoteJid, { text: '¡Pong!' });
        }
    });
}

startBot();