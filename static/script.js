// Connexion au serveur Socket.IO
const socket = io();

// Éléments DOM
const loginModal = document.getElementById('login-modal');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('room');
const joinBtn = document.getElementById('join-btn');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const roomTitle = document.getElementById('room-title');
const onlineCount = document.getElementById('online-count');
const typingIndicator = document.getElementById('typing-indicator');
const themeToggle = document.getElementById('theme-toggle');

// Variables
let username = '';
let room = '';

// Toggle thème sombre
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// Rejoindre une room
joinBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    room = roomInput.value.trim();
    if (username && room) {
        socket.emit('join', { username, room });
        loginModal.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        roomTitle.textContent = `Room: ${room}`;
    }
});

// Envoyer un message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', { username, room, message });
        messageInput.value = '';
        socket.emit('stop_typing', { room });
    }
}

// Gestion des événements Socket.IO
socket.on('message', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(data.username === username ? 'sent' : 'received');
    messageDiv.textContent = `${data.username}: ${data.message}`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('user_joined', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'received');
    messageDiv.textContent = `${data.username} a rejoint la room.`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    onlineCount.textContent = `En ligne: ${data.online_count}`;
});

socket.on('user_left', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'received');
    messageDiv.textContent = `${data.username} a quitté la room.`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    onlineCount.textContent = `En ligne: ${data.online_count}`;
});

socket.on('typing', () => {
    typingIndicator.classList.remove('hidden');
});

socket.on('stop_typing', () => {
    typingIndicator.classList.add('hidden');
});

// Indicateur de frappe (simple : déclenché à chaque saisie)
messageInput.addEventListener('input', () => {
    socket.emit('typing', { room });
});

messageInput.addEventListener('blur', () => {
    socket.emit('stop_typing', { room });
});