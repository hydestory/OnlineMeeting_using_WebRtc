let localstream
let remotestream
let message
let screenTrack

const socket = io.connect('http://localhost:5000')

const servers={iceServers:[{urls: 'stun:stun.l.google.com:19302'}]}


let init = async () => {
    localstream = await navigator.mediaDevices.getUserMedia({video:true, audio:true})
    document.getElementById('user-1').srcObject = localstream

    createOffer()
    socket.on('offer', message => createAnswer(message))
    socket.on('answer', message => addAnswer(message))
    socket.on('ice_candidate', message => addIceCandidate(message))


}



let createPeerConnection = async () => {
    peerConnection = new RTCPeerConnection(servers)

    remotestream = new MediaStream()
    document.getElementById('user-2').srcObject = remotestream
    document.getElementById('user-2').style.display = 'block'

    document.getElementById('user-1').classList.add('smallFrame')


    if(!localstream){
        localstream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        document.getElementById('user-1').srcObject = localstream
    }

    localstream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localstream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remotestream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            socket.emit('ice_candidate', {'candidate': event.candidate})
        }
    }

    peerConnection.oniceconnectionstatechange = async ()=> {
        console.log('ICE connection state change: ', peerConnection.iceConnectionState)
        if (peerConnection.iceConnectionState === 'disconnected' ||
            peerConnection.iceConnectionState === 'failed' ||
            peerConnection.iceConnectionState === 'closed') {
            document.getElementById('user-2').style.display = 'none'
            document.getElementById('user-1').classList.remove('smallFrame')    
            console.log('User left the room.')
        }
    }

    dataChannel = await peerConnection.createDataChannel('chat')

    dataChannel.onmessage = e=>console.log('Received message:', e.data)
        
    dataChannel.onopen = e=>console.log('Data channel is open!!!')

    dataChannel.onclose = e=>console.log('Data channel is closed')

    dataChannel.onmessage = e => {
        console.log('Received message:', e.data)
        addMessageToChat('remote', e.data)
    }
}



let createOffer = async () => {
    await createPeerConnection()
  
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    console.log("Offer created and set as local description. Sending it to the server.")
    socket.emit('offer', { 'offer': offer })
    peerConnection.ondatachannel = e => dataChannel = e.channel
}


let createAnswer = async (message) => {
    await createPeerConnection()
    console.log("Received offer from server. Setting it as remote description.")
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer))
    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    socket.emit('answer', { 'answer': answer })
    peerConnection.ondatachannel = e => dataChannel = e.channel
}


let addAnswer = async (message) => {
    if(!peerConnection.currentRemoteDescription){
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer))
    }
}

let addIceCandidate = async (message) => {
    if(message.candidate){
        try{
            await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate))
        }catch(e){
            console.error('Error adding received ice candidate', e)
        }
    }
}



let sendChatMessage = () => {
    let messageInput = document.querySelector('.input-group input[type="text"]')
    let message = messageInput.value
    if (message) {
        addMessageToChat('local', message)
        if (dataChannel.readyState === 'open') {
            dataChannel.send(message)
        }
        messageInput.value = ''
    }
}

//askchatgpt
let askChatGPT = () => {
    let messageInput = document.querySelector('.input-groups input[type="text"]')
    let message = messageInput.value
    let chatContainer = document.querySelector('.chat-containers')
    let messageTemplate = document.getElementById(`local-message-template`)
    let newMessage = messageTemplate.cloneNode(true)
    newMessage.removeAttribute('id')
    newMessage.style.display = ''
    messageInput.value = ''
    newMessage.querySelector('.message-content').innerText = message
    chatContainer.appendChild(newMessage)
    chatContainer.scrollTop = chatContainer.scrollHeight
    if (message) {
        socket.emit('ask_chatgpt', message )
    }
}


let addMessageToChat = (type, message) => {
    let chatContainer = document.querySelector('.chat-container')
    let messageTemplate = document.getElementById(`${type}-message-template`)
    let newMessage = messageTemplate.cloneNode(true)
    newMessage.removeAttribute('id')
    newMessage.style.display = ''
    newMessage.querySelector('.message-content').innerText = message
    chatContainer.appendChild(newMessage)
    chatContainer.scrollTop = chatContainer.scrollHeight
}


//addchatgpt's answer
let addanswerfromchatgpt = (message) => {
    let chatContainer = document.querySelector('.chat-containers')
    let messageTemplate = document.getElementById(`remote-message-template`)
    let newMessage = messageTemplate.cloneNode(true)
    newMessage.removeAttribute('id')
    newMessage.style.display = ''
    newMessage.querySelector('.message-content').innerText = message
    chatContainer.appendChild(newMessage)
    chatContainer.scrollTop = chatContainer.scrollHeight
}




let shareScreen = async () => {
    if (!screenTrack) {
        screenTrack = await navigator.mediaDevices.getDisplayMedia({video: true})
        localstream.getTracks().forEach(track => track.stop())
        localstream = screenTrack

        
        let sender = peerConnection.getSenders().find(s => s.track.kind === 'video')
        sender.replaceTrack(screenTrack.getTracks()[0])
        document.getElementById('screen-share-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    } else {
        screenTrack.getTracks().forEach(track => track.stop())
        screenTrack = null

        localstream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
        let videoTrack = localstream.getTracks().find(track => track.kind === 'video')
        let sender = peerConnection.getSenders().find(s => s.track.kind === 'video')
        sender.replaceTrack(videoTrack)

        
        document.getElementById('screen-share-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}






let toggleCamera = async () => {
    let videoTrack = localstream.getTracks().find(track => track.kind === 'video')

    if(videoTrack.enabled){
        videoTrack.enabled = false
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        videoTrack.enabled = true
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}

let toggleMic = async () => {
    let audioTrack = localstream.getTracks().find(track => track.kind === 'audio')

    if(audioTrack.enabled){
        audioTrack.enabled = false
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        audioTrack.enabled = true
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}

let toggleChat = () => {
    
    let working=true
    if(working){
        audioTrack.enabled = false
        document.getElementById('chat-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        audioTrack.enabled = true
        document.getElementById('chat-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}

document.getElementById('screen-share-btn').addEventListener('click', shareScreen)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('chat-btn').addEventListener('click', ()=>$('#chatModal').modal('show'))
document.getElementById('chatgpt-btn').addEventListener('click', ()=>$('#chatgptModal').modal('show'))
document.getElementById('refresh-btn').addEventListener('click', () =>location.reload())
document.querySelector('.input-group-append button').addEventListener('click', sendChatMessage)
document.querySelector('.input-group-appends button').addEventListener('click', askChatGPT)
socket.on('answerfromchatgpt', response => addanswerfromchatgpt(response))


init()