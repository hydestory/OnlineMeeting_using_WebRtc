let uid = String(Math.floor(Math.random() * 10000))

let client;
let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

let constraints = {
    video:true,
    audio:false
}

let init = async () => {

    client = await io.connect('http://127.0.0.1:5000');

    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    document.getElementById('user-1').srcObject = localStream

    client.on('connect', function() {
        console.log('Connected to the server');
        client.emit('join', uid);
    });

    client.on('message', handleMessageFromPeer);
}
 

let handleMessageFromPeer = async (message) => {

    message = JSON.parse(message.text)

    if(message.type === 'offer'){
        createAnswer(message.offer)
    }

    if(message.type === 'answer'){
        addAnswer(message.answer)
    }

    if(message.type === 'candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }
}

let createPeerConnection = async () => {
    peerConnection = new RTCPeerConnection(servers)

    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        document.getElementById('user-1').srcObject = localStream
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            client.emit('message', JSON.stringify({'type':'candidate', 'candidate':event.candidate}))
        }
    }
}

let createOffer = async () => {
    await createPeerConnection()

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    client.emit('message', JSON.stringify({'type':'offer', 'offer':offer}))
}


let createAnswer = async (offer) => {
    await createPeerConnection()

    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.emit('message', JSON.stringify({'type':'answer', 'answer':answer}))
}


let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

init()
