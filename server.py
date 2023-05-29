from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO,emit
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")  # 設定跨域

online_users = []  # 在線使用者列表
connected_users= [] # 連線中使用者列表
pending_connections = {}  # 建立一個 dictionary 來存放等待對方回覆的使用者



CORS(app)

@app.route('/api/online_users', methods=['GET'])
def get_online_users():
    return jsonify(online_users)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    return render_template('register.html', online_users=online_users)

@app.route('/submit', methods=['POST'])
def submit():
    username = request.form.get('userName')
    online_users.append(username)
    return render_template('chooseuser.html', online_users=online_users,yourname=username)

@app.route('/livetalk')
def livetalk():
    return render_template('livetalk.html')

@app.route('/livechat')
def livechat():
    return render_template('livechat.html')

@socketio.on('message')
def handle_message(chatmessage):
    emit('message', chatmessage, broadcast=True)

@socketio.on('offer')
def handle_offer(message):
    print('get offer!!!')
    emit('offer', message, broadcast=True, include_self=False)

@socketio.on('answer')
def handle_answer(message):
    print('get answer!!!')
    emit('answer', message, broadcast=True, include_self=False)

@socketio.on('ice_candidate')
def handle_ice_candidate(message):
    print('ice_candidate!!!')
    candidate = message['candidate']
    emit('ice_candidate', {'candidate': candidate}, broadcast=True, include_self=False)


#new
@socketio.on('connect_request')
def handle_connect_request(requester, requested):
    if requested in online_users:
        print('connect_request!!!')
        pending_connections[requested] = requester
        emit('connect_request', requester,broadcast=True, include_self=False)
    else:
        emit('connect_request_fail')

@socketio.on('accept_request')
def handle_accept_request(user):
    if user in pending_connections:
        requester = pending_connections.pop(user)
        emit('connect_accepted', requester, broadcast=True)
        connected_users.append(user)
        

@socketio.on('reject_request')
def handle_reject_request(user):
    if user in pending_connections:
        requester = pending_connections.pop(user)
        emit('connect_rejected')


if __name__ == '__main__':
    socketio.run(app)
    app.debug = True
