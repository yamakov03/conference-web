import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import WebcamComponent from "../WebcamComponent";
import Webcam from 'react-webcam';
import Button from '@mui/material/Button';
import ContainerMUI from '@mui/material/Container';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 100vh;
    width: 90%;
    margin: auto;
    flex-wrap: wrap;
`;

const StyledVideo = styled.video`
    height: 40%;
    width: 50%;
`;

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <StyledVideo playsInline autoPlay ref={ref} />
    );
}

// const videoConstraints = {
//     height: window.innerHeight / 2,
//     width: window.innerWidth / 2
// };


const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;

    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [isCameraOn, setIsCameraOn] = useState(true);

    const handleDevices = () => {
        navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
          const videoDevices = mediaDevices.filter(({ kind }) => kind === 'videoinput');
          setDevices(videoDevices);
          if (videoDevices.length > 0) {
            setSelectedDeviceId(videoDevices[0].deviceId);
            console.log(videoDevices);
          }
        });
      };

      const switchCamera = (deviceId) => {
        setSelectedDeviceId(deviceId);
      
        peersRef.current.forEach((peerObj) => {
          navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
            audio: false,
          }).then(newStream => {
            userVideo.current.srcObject = newStream;
      
            const existingStream = peerObj.peer.streams[0];
            const existingVideoTrack = existingStream.getVideoTracks()[0]; // Get the existing video track
      
            // Get the video track from the new stream
            const newVideoTrack = newStream.getVideoTracks()[0];
      
            if (existingVideoTrack) {
              // Replace the video track in the peer connection's stream
              existingStream.removeTrack(existingVideoTrack); // Remove existing track
              existingStream.addTrack(newVideoTrack); // Add the new video track
      
              peerObj.peer.replaceTrack(existingVideoTrack, newVideoTrack, existingStream);
            } else {
              console.error('Existing video track not found in the stream');
            }
          }).catch(error => {
            console.error("Error accessing media devices:", error);
          });
        });
      };
      
      useEffect(() => {
        handleDevices();
      }, []);
    
      const videoConstraints = {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 400, ideal: 1080, max: 1080 },
        aspectRatio: 1.777777778,
        frameRate: { min: 24, ideal: 30, max: 60},
        facingMode: 'user',
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
      };
    
      const style = {
        width: '100%', 
        maxWidth: '100px',
        height: 'auto'
      };

      useEffect(() => {
        socketRef.current = io.connect("/");
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;
            socketRef.current.emit("join room", roomID);
            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push({
                        peerID: userID,
                        peer,
                    })
                })
                setPeers(peers);
            })

            socketRef.current.on("user joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                })

                setPeers(users => [...users, {peer, peerID: payload.callerID}]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socketRef.current.on('user disconnected', id => {
                const peerObj = peersRef.current.find(p => p.peerID === id);
                if(peerObj) {
                    peerObj.peer.destroy();
                }
                const peers = peersRef.current.filter(p => p.peerID !== id);
                peersRef.current = peers;
                setPeers(peers);
            });
        })
    }, []);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })
        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })
        peer.signal(incomingSignal);
        return peer;
    }

    const leaveCall = () => {
        socketRef.current.emit("disconnect");
        props.history.push('/');
    }

    return (
        <>
            <ContainerMUI>
                <h1>Room ID: {roomID}</h1>
                <Box display="flex" justifyContent="center">
                    {isCameraOn && selectedDeviceId && (
                    <Webcam
                        audio={false}
                        videoConstraints={videoConstraints}
                        style={style}
                        ref={userVideo}
                    />
                    )}
                </Box>
                <Box display="flex" justifyContent="center">
                    <Select
                        style={{ marginTop: '20px', marginRight: '20px' }}
                        value={selectedDeviceId}
                        onChange={(e) => switchCamera(e.target.value)}
                    >
                        {devices.map((device, key) => (
                            <MenuItem key={key} value={device.deviceId}>
                            {device.label || `Device ${key + 1}`}
                            </MenuItem>
                        ))}
                    </Select>
                    <Button
                        style={{ marginTop: '20px', marginRight: '20px' }}
                        variant="contained"
                        color="primary"
                        onClick={() => setIsCameraOn((prev) => !prev)}
                    >
                        {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                    </Button>
                    <Button
                        style={{ marginTop: '20px', marginRight: '20px' }}
                        variant="contained"
                        color="secondary"
                        onClick={leaveCall}
                    >
                        Leave call
                    </Button>
                </Box>
            </ContainerMUI>
            {/* <StyledVideo muted ref={userVideo} autoPlay playsInline /> */}
        
            <div className="flex flex-row">
                {peers.map((peer) => {
                    return (
                        <Video key={peer.peerID} peer={peer.peer} />
                    );
                })}
            </div>
        </>
    );
};

export default Room;
