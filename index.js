const localVideo = document.querySelector('#local');
const remoteVideo = document.querySelector('#remote');
const getMediaBtn = document.querySelector('#getMediaBtn');
const connectBtn = document.querySelector('#connectBtn');
const closeBtn = document.querySelector('#closeBtn');

let pc1, pc2, localStream;

getMediaBtn.addEventListener('click', getLocalStream);
connectBtn.addEventListener('click', connect);
closeBtn.addEventListener('click', close);

function getLocalStream() {
  console.log('获取本地媒体流');
  getMediaBtn.disabled = true;
  navigator.getUserMedia({
    video: true,
  }, function(stream) {
    localStream = stream;
    localVideo.srcObject = stream;
    connectBtn.disabled = false;
  }, function(err) {
    console.error(`getUserMedia() error: ${err.name}`);
  });
}

async function connect() {
  connectBtn.disabled = true;
  closeBtn.disabled = false;
  console.log('开始连接连接');

  pc1 = new RTCPeerConnection({});
  console.log('创建本地 pc 实例 pc1');
  pc1.addEventListener('icecandidate', e => onIceCandidate(pc2, e));

  pc2 = new RTCPeerConnection({});
  console.log('创建远程 pc 实例 pc2');
  pc2.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
  pc2.addEventListener('addstream', gotRemoteStream);

  console.log('添加本地流到 pc1 中');
  pc1.addStream(localStream);

  console.log('pc1 创建 offer');
  const offer = await pc1.createOffer({
    offerToReceiveVideo: 1,
  });
  console.log(`Offer \n${offer.sdp}`);
  console.log('pc1 setLocalDescription');
  await pc1.setLocalDescription(offer);

  console.log('pc2 setRemoteDescription'); // 省去了发送 offer 信令给 pc2 的过程
  await pc2.setRemoteDescription(offer);
  console.log('pc2 createAnswer');
  const answer = await pc2.createAnswer();
  console.log(`Answer :\n${answer.sdp}`);
  console.log('pc2 setLocalDescription');
  await pc2.setLocalDescription(answer);

  console.log('pc1 setRemoteDescription'); // 省去了 pc2 将 answer 发送给 pc1 的过程
  await pc1.setRemoteDescription(answer);
}

function close() {
  console.log('关闭连接');
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  closeBtn.disabled = true;
  connectBtn.disabled = false;
}

// 远程 pc2 实例获取到本地流
function gotRemoteStream(e) {
  if (remoteVideo.srcObject !== e.stream) {
    remoteVideo.srcObject = e.stream;
    console.log('pc2 收到媒体流');
  }
}

function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}

// ICE 候选可用
async function onIceCandidate(pc, event) {
  await pc.addIceCandidate(event.candidate);
  console.log(`${getName(pc)} 添加 ICE candidate 候选成功:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}