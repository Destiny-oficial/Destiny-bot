const makeWASocket = require('@adiwajshing/baileys').default;
const { useSingleFileAuthState } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const { unlinkSync } = require('fs');
const { join } = require('path');

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,  // Muestra el código QR en la terminal
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            console.log('Conexión cerrada:', lastDisconnect.error);
            if (shouldReconnect) {
                startBot();
            } else {
                unlinkSync('./auth_info.json'); // Elimina el archivo de autenticación si es necesario
            }
        } else if (connection === 'open') {
            console.log('¡Conectado a WhatsApp!');
        }
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        if (!message.key.fromMe && message.message) {
            const from = message.key.remoteJid;
            console.log('Nuevo mensaje de:', from);

            // Responde "¡Hola!" si el mensaje recibido es "hola"
            if (message.message.conversation === 'hola') {
                await sock.sendMessage(from, { text: '¡Hola! Soy un bot de WhatsApp.' });
            }
        }
    });
}

startBot();
