import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Room from './routes/Room';

function WebcamComponent({webcamRef}) {
  

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(true);
  // const [refSwitch, setRefSwitch] = useState(false);


  const handleDevices = () => {
    navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
      const videoDevices = mediaDevices.filter(({ kind }) => kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    });
  };

  const switchCamera = (deviceId) => {
    setSelectedDeviceId(deviceId);
    // setRefSwitch(true);
    // webcamRef = webcamRef.current;
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
    deviceId: selectedDeviceId,
  };

  const style = {
    width: '100%', 
    maxWidth: '960px',
    height: 'auto'
  };

  return (
    <Container>
      <Box display="flex" justifyContent="center">
        {isCameraOn && selectedDeviceId && (
          <Webcam
            audio={false}
            videoConstraints={videoConstraints}
            style={style}
            ref={webcamRef}
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
      </Box>
    </Container>
  );
}

export default WebcamComponent;
