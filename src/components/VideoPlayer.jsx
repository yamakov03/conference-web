import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export const VideoPlayer = ({ user, isLocalUser }) => {
  const ref = useRef();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    user.videoTrack.play(ref.current);
    fetchDevices();
    return () => {
      if (user.videoTrack) {
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

  const switchCamera = async () => {
    if (user.videoTrack && isLocalUser) {
      try {
        await user.videoTrack.setDevice(selectedDeviceId);
      } catch (error) {
        console.error('Error switching camera:', error);
      }
    }
  };

  const leaveCall = () => {
    window.location.reload();
  };

  return (
    <div>
      Uid: {user.uid}
      <div ref={ref} style={{ width: '200px', height: '200px' }}></div>
      {isLocalUser && (
        <div>
          <label>
            Choose Camera:
            <Select
              value={selectedDeviceId}
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
            style={{ marginTop: '20px', marginRight: '20px' }}
            variant="contained"
            color="primary"
            onClick={switchCamera}
          >
            Switch Camera
          </Button>
          <Button 
            style={{ marginTop: '20px', marginRight: '20px' }}
            variant="contained"
            color="secondary"
            onClick={leaveCall}
          >
            Leave Call
          </Button>
        </div>
      )}
    </div>
  );
};