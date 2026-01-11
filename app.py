from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# Stockage en mémoire pour les messages et utilisateurs par room
rooms = {}  # {room: {'messages': [], 'users': set()}}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['room']
    join_room(room)
    
    if room not in rooms:
        rooms[room] = {'messages': [], 'users': set()}
    
    rooms[room]['users'].add(username)
    
    # Envoyer l'historique des messages
    for msg in rooms[room]['messages']:
        emit('message', msg, room=request.sid)
    
    # Notifier les autres
    emit('user_joined', {'username': username, 'online_count': len(rooms[room]['users'])}, room=room, skip_sid=request.sid)
    emit('user_joined', {'username': username, 'online_count': len(rooms[room]['users'])}, room=request.sid)

@socketio.on('message')
def handle_message(data):
    username = data['username']
    room = data['room']
    message = data['message']
    
    msg_data = {'username': username, 'message': message}
    rooms[room]['messages'].append(msg_data)
    
    emit('message', msg_data, room=room)

@socketio.on('disconnect')
def on_disconnect():
    # Trouver l'utilisateur et la room (simplifié : on suppose une seule room par socket)
    for room, data in rooms.items():
        for user in list(data['users']):
            # Ici, on ne peut pas facilement mapper sid à user sans stockage supplémentaire
            # Pour simplicité, on nettoie à la déconnexion globale
            pass
    # Note: Gestion complète des déconnexions par room nécessiterait un mapping sid -> (user, room)

@socketio.on('typing')
def on_typing(data):
    room = data['room']
    emit('typing', room=room, skip_sid=request.sid)

@socketio.on('stop_typing')
def on_stop_typing(data):
    room = data['room']
    emit('stop_typing', room=room, skip_sid=request.sid)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Utilise le port de Railway ou 5000 par défaut
    socketio.run(app, host='0.0.0.0', port=port, debug=False)  # Désactive debug pour prod