from flask import Flask, render_template
from flask_socketio import SocketIO, join_room, leave_room
from flask_ngrok2 import run_with_ngrok

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
run_with_ngrok(app,auth_token='2NEfCM1wiclAWUDcizFdhQxIjc2_7KYMXxMCcqPrKmMGXiaq4')
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    # 連接建立時，將用戶加入房間
    join_room('chatroom')

@socketio.on('disconnect')
def handle_disconnect():
    # 連接斷開時，將用戶從房間中移除
    leave_room('chatroom')

@socketio.on('message')
def handle_message(message):
    # 接收到來自客戶端的訊息，並傳送給同一房間的其他用戶
    socketio.emit('message', message, room='chatroom')

if __name__ == '__main__':
    socketio.run(app)
