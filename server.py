from flask import Flask, render_template,request
from flask_ngrok2 import run_with_ngrok

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
# run_with_ngrok(app,auth_token='2NEfCM1wiclAWUDcizFdhQxIjc2_7KYMXxMCcqPrKmMGXiaq4')

online_users = ['roger']  # 在線使用者列表

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    return render_template('register.html',online_users=online_users)

@app.route('/submit', methods=['POST'])
def submit():
    username=request.form.get('userName')
    online_users.append(username)

    return render_template('chooseuser.html',online_users=online_users)

# @app.route('/chooseuser', methods=['POST'])
# def chooseuser():
#     return render_template('chooseuser.html',online_users=online_users)


if __name__ == '__main__':
    app.run()
