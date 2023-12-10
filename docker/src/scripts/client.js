// DOM elements.
const roomSelectionContainer = document.getElementById('room-selection-container');
const roomInput = document.getElementById('room-input');
const connectButton = document.getElementById('connect-button');
const videoChatContainer = document.getElementById('video-chat-container');
const localVideoComponent = document.getElementById('local-video');

// Variables.
const socket = io();
const mediaConstraints = { audio: true, video: { width: 1280, height: 720 } };
let localStream;
let roomId;
let peerConnections = {}; // Dictionary to hold all peer connections
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

// BUTTON LISTENER
connectButton.addEventListener('click', () => {
  joinRoom(roomInput.value);
});

const hangUpButton = document.getElementById('hangup-button');
const toggleMicButton = document.getElementById('toggle-mic-button');
const toggleCameraButton = document.getElementById('toggle-camera-button');

hangUpButton.addEventListener('click', hangUpCall);
toggleMicButton.addEventListener('click', toggleMicrophone);
toggleCameraButton.addEventListener('click', toggleCamera);


// SOCKET EVENT CALLBACKS
socket.on('room_created', async () => {
  console.log('Socket event callback: room_created');
  await setLocalStream(mediaConstraints);
});

socket.on('room_joined', async () => {
  console.log('Socket event callback: room_joined');
  await setLocalStream(mediaConstraints);
  socket.emit('start_call', roomId);
});

socket.on('full_room', () => {
  console.log('Socket event callback: full_room');
  alert('The room is full, please try another one');
});

socket.on('start_call', async () => {
  console.log('Socket event callback: start_call');
});

socket.on('webrtc_offer', async (data) => {
  console.log('Socket event callback: webrtc_offer');
  await handleOffer(data);
});

socket.on('webrtc_answer', (data) => {
  console.log('Socket event callback: webrtc_answer');
  handleAnswer(data);
});

socket.on('webrtc_ice_candidate', (data) => {
  console.log('Socket event callback: webrtc_ice_candidate');
  handleNewICECandidateMsg(data);
});

socket.on('new_peer', (peerId) => {
  console.log('Socket event callback: new_peer');
  handleNewPeer(peerId);
});

// FUNCTIONS
async function joinRoom(room) {
  if (room === '') {
    alert('Please type a room ID');
  } else {
    roomId = room;
    socket.emit('join', room);
    showVideoConference();
    await setLocalStream(mediaConstraints).catch(error => {
      console.error('Could not get user media', error);
    });
  }
}

function showVideoConference() {
  roomSelectionContainer.style = 'display: none';
  videoChatContainer.style = 'display: block';
}

async function setLocalStream(mediaConstraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    console.log('Local stream obtained', stream); // Log pour déboguer
    localStream = stream;
    localVideoComponent.srcObject = stream;
  } catch (error) {
    console.error('Could not get user media', error);
  }
}

async function handleNewPeer(peerId) {
  if (!peerConnections[peerId]) {
    await createPeerConnection(peerId);
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnections[peerId].addTrack(track, localStream);
      });
    }
    if (roomId) {
      const offer = await peerConnections[peerId].createOffer();
      await peerConnections[peerId].setLocalDescription(offer);
      socket.emit('webrtc_offer', {
        type: 'webrtc_offer',
        sdp: offer,
        roomId,
        peerId,
      });
    }
  }
}

async function createPeerConnection(peerId) {
  const peerConnection = new RTCPeerConnection(iceServers);

  peerConnection.ontrack = (event) => {
    handleRemoteStreamAdded(event.streams[0], peerId);
  };
  peerConnection.onicecandidate = (event) => {
    handleICECandidateEvent(event, peerId);
  };

  peerConnections[peerId] = peerConnection;
  return peerConnection;
}

async function handleOffer(data) {
  if (!peerConnections[data.peerId]) {
    await createPeerConnection(data.peerId);
  }
  const peerConnection = peerConnections[data.peerId];
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('webrtc_answer', {
    type: 'webrtc_answer',
    sdp: answer,
    roomId,
    peerId: data.peerId,
  });
}

function handleAnswer(data) {
  const peerConnection = peerConnections[data.peerId];
  peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
}

function handleICECandidateEvent(event, peerId) {
  if (event.candidate) {
    socket.emit('webrtc_ice_candidate', {
      type: 'webrtc_ice_candidate',
      candidate: event.candidate,
      roomId,
      peerId,
    });
  }
}

function handleNewICECandidateMsg(data) {
  const peerConnection = peerConnections[data.peerId];
  peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
}

function addVideoStream(videoElement, stream, isLocal = false) {
  console.log('Adding video stream', { videoElement, stream, isLocal }); // Log pour déboguer
  videoElement.srcObject = stream;
  videoElement.autoplay = true;
  videoElement.playsInline = true;
  videoElement.muted = isLocal; // La vidéo locale doit être en sourdine pour éviter les échos
  if (isLocal) {
    videoElement.id = 'local-video';
    videoElement.style.backgroundColor = 'red'; // Pour le débogage
  } else {
    videoElement.classList.add('remote-video');
    videoElement.style.backgroundColor = 'green'; // Pour le débogage
  }
  videoChatContainer.appendChild(videoElement);
}

function handleRemoteStreamAdded(stream, peerId) {
  // Vérifiez si l'élément vidéo existe déjà pour ce peerId
  let remoteVideoElement = document.getElementById(`remote-video-${peerId}`);
  if (!remoteVideoElement) {
    remoteVideoElement = document.createElement('video');
    remoteVideoElement.autoplay = true;
    remoteVideoElement.playsInline = true;
    remoteVideoElement.classList.add('remote-video');
    remoteVideoElement.id = `remote-video-${peerId}`;
    videoChatContainer.appendChild(remoteVideoElement);
  }

  remoteVideoElement.srcObject = stream;
}

function hangUpCall() {
  for (let peerId in peerConnections) {
    peerConnections[peerId].close();
    delete peerConnections[peerId];
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  // Cacher la zone de vidéo conférence et montrer la sélection de salle
  videoChatContainer.style.display = 'none';
  roomSelectionContainer.style.display = 'block';
}

function toggleMicrophone() {
  if (localStream) {
    localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
  }
}

function toggleCamera() {
  if (localStream) {
    localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
  }
}
