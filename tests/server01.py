from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")  # Enable CORS
CORS(app)

online_users = {}  # Online users list. Now it's a dict with socket ids as keys

@app.route('/')
def index():
    return render_template('test.html')

@socketio.on('message')
def handle_message(message):
    message = message.json
    receiver_id = message['receiver_id']
    if receiver_id in online_users:
        emit('message', message, room=online_users[receiver_id])

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')
    if request.sid in online_users:
        del online_users[request.sid]

@socketio.on('join')
def handle_join(uid):
    online_users[request.sid] = uid
    print('User {} has joined with id {}'.format(uid, request.sid))


if __name__ == '__main__':
    socketio.run(app)
