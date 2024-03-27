import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export const VideoPlayer = ({ user, isLocalUser, users, isReceiver }) => {
  const ref = useRef();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('All Users');

  const [videoTrack, setVideoTrack] = useState(null);
  const [modelVideoTrack, setModelVideoTrack] = useState(null);

  const imgRef = useRef();
  const canvasRef = useRef();
  const [stream, setStream] = useState(null);
  const videoRef = useRef();

  useEffect(() => {
    
    if (videoTrack) {
      videoTrack.play(ref.current);
    } else {
      user.videoTrack.play(ref.current);
    }
    fetchDevices();
    return () => {
      if (videoTrack) {
        videoTrack.stop();
      }
      else if (user.videoTrack) {
        user.videoTrack.stop();
      }
    };
  }, [user.videoTrack]);

  

  const fetchDevices = async () => {
    try {
      const deviceList = await AgoraRTC.getCameras();
      setDevices(deviceList);
      if (deviceList.length > 0) {
        setSelectedDeviceId(deviceList[0].deviceId);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  // useEffect(() => {
  //   // Existing code...

  //   // Create the original video track
  //   const originalVideoTrack = AgoraRTC.createCustomVideoTrack({
  //     mediaStreamTrack: fetch('http://localhost:7000/original_video_feed').then(response => response.body),
  //   });

  //   // Create the model video track
  //   const modelVideoTrack = AgoraRTC.createCustomVideoTrack({
  //     mediaStreamTrack: fetch('http://localhost:7000/model_video_feed').then(response => response.body),
  //   });

  //   setVideoTrack(originalVideoTrack);
  //   setModelVideoTrack(modelVideoTrack);
  // }, []);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream();  // 30 FPS
      // Start a loop to continuously update the canvas with the current image
      const interval = setInterval(() => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }, 1000 / 30);  // 30 FPS

      // Capture the canvas output as a MediaStream
      
      setStream(stream);
  
      return () => {
        clearInterval(interval);
      };
  }, []);

  useEffect(() => {
    videoRef.current.srcObject = stream;
}, [stream]);

  // useEffect(() => {
  //   if (stream) {
  //     const modelVideoTrack = AgoraRTC.createCustomVideoTrack({
  //       mediaStreamTrack: stream,
  //     });
  
  //     // setVideoTrack(originalVideoTrack);
  //     setVideoTrack(modelVideoTrack);
  //   }
  // }, [stream]);

  const switchCamera = async () => {
    if (user.videoTrack && isLocalUser) {
      try {
        await user.videoTrack.setDevice(selectedDeviceId);
      } catch (error) {
        console.error('Error switching camera:', error);
      }
      const response = await fetch(`/api/switch-camera?senderUid=${user.uid}&recipientUid=${selectedRecipient}`, {
        method: 'POST',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log(data);
    }
  };

  const leaveCall = () => {
    window.location.reload();
  };

  return (
    <div>
      <video ref={videoRef} controls style={{width: '300px', height:'200px', border: '1px solid black' }}/>
      {!isLocalUser && <div>
        Uid: {user.uid}
      </div>
      }
      <div ref={ref} style={{
        width: isLocalUser ? '200px' : isReceiver ? '400px' : '300px',
        height: isLocalUser ? '200px' : isReceiver ? '400px' : '300px',
        position: isLocalUser ? 'absolute' : 'static',
        bottom: isLocalUser ? 76 : 'auto',
        right: isLocalUser ? 0 : 'auto'
      }}>
        {isLocalUser && <>
          <div>
          <img ref={imgRef} src="http://localhost:7000/api/video/model_video_feed" style={{display: "none"}}  alt="Video feed" />
          <canvas ref={canvasRef} style={{width: '300px', height:'200px', border: '1px solid black' }}  ></canvas>
        </div>
        {/* <div>
          <img ref={imgRef} src="http://localhost:7000/original_video_feed" alt="Video feed" />
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </div> */}
        </>}
      
        

      </div>
      {isLocalUser && (
        <div className="flex text-white justify-center w-full items-center bg-gray-700 gap-5 align-middle p-5 absolute bottom-0 start-0 left-0 sticky-bottom">
          <label>
            <Select
              value={selectedDeviceId}
              className="bg-white h-[35px]"
              onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
              {devices.map((device) => (
                <MenuItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId}`}
                </MenuItem>
              ))}
            </Select>
          </label>
          <Button
            variant="contained"
            color="primary"
            onClick={switchCamera}
          >
            Switch Camera
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={leaveCall}
          >
            Leave Call
          </Button>
          <p>
            Your user ID: {user.uid}
          </p>
          <label>
            <Select
              value={selectedRecipient}
              placeholder='Select recipient'
              onChange={(e) => setSelectedRecipient(e.target.value)}
              displayEmpty
              renderValue={(value) => {
                if (!value) {
                  return <em>Select recipient</em>;
                }
                return value;
              }}
            >
              <MenuItem value='All Users'>
                All Users
              </MenuItem>
              {users.filter((u) => u.uid !== user.uid).map((u) => (
                <MenuItem key={u.uid} value={u.uid}>
                  {u.uid}
                </MenuItem>
              ))}
            </Select>
          </label>

        </div>
      )}
    </div>
  );
};