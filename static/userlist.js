
const socket = io.connect('http://127.0.0.1:5000')

    // refresh botton
    let refreshUserList=()=> {
      fetch('/api/online_users')  
        .then(response => response.json())
        .then(data => {
          const userList = document.getElementById('userList');
          userList.innerHTML = '';  
          
          data.forEach(user => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            
            const userDiv = document.createElement('div');
            userDiv.className = 'd-flex justify-content-between align-items-center';

            const usernameSpan = document.createElement('span');
            usernameSpan.textContent = user;

            const connectButton = document.createElement('button');
            connectButton.id = user + '-btn';
            connectButton.className = 'btn btn-primary btn-sm';
            connectButton.textContent = 'Connect';
            connectButton.onclick = function() { showConfirmation(user); };

            userDiv.appendChild(usernameSpan);
            userDiv.appendChild(connectButton);
            listItem.appendChild(userDiv);
            userList.appendChild(listItem);
          });
        });
    }


    //press confirm button
    let showConfirmation=(user)=> {
        userToConnect = user;
        document.getElementById('userToConnect').textContent = user;
        let confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        document.getElementById('acceptConfirmationButton').style.display = 'none';
        confirmationModal.show();
    }
      

    // 用戶點擊連線按鈕
    let connect = () => {
      console.log("Connect clicked for user:", userToConnect,"yourname:",yourname);
      let connectButton = document.getElementById(userToConnect + '-btn');
      connectButton.textContent = 'Connecting...';
      connectButton.disabled = true; 

      let confirmationModal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
      confirmationModal.hide();

      // 發送連線請求給伺服器
      socket.emit('connect_request', yourname, userToConnect);
    }

    // 處理收到的連線請求
    socket.on('connect_request', function(requester) {
      console.log("connect_request from:",requester);
      document.getElementById('confirmationModalLabel').textContent = '連線請求';
      document.getElementById('userToConnect').textContent = requester;
      document.getElementById('acceptConfirmationButton').style.display = 'block';
      document.getElementById('connect-button').style.display = 'none';
      let confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
      confirmationModal.show();
    });


    // 如果連線請求被接受，則跳轉到新的頁面
    socket.on('connect_accepted', function() {
      window.location.href = '/livetalk';  // 跳轉到新的頁面
    });

    // 如果連線請求被拒絕，則讓用戶知道
    socket.on('connect_rejected', function() {
      alert('Connection rejected');
    });

    // 當用戶決定接受或拒絕連線請求時
    let acceptRequest = () => {
      socket.emit('accept_request', yourname);
    }

    let rejectRequest = () => {
      socket.emit('reject_request', yourname);
    }

    document.getElementById('acceptConfirmationButton').addEventListener('click', acceptRequest);