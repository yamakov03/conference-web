import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

export const VideoPlayer = ({ user, isLocalUser }) => {
  const ref = useRef();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    user.videoTrack.play(ref.current);
    fetchDevices();
    return () => {
      user.videoTrack.stop();
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

  return (
    <div>
      Uid: {user.uid}
      <div ref={ref} style={{ width: '200px', height: '200px' }}></div>
      {isLocalUser && (
        <div>
          <label>
            Choose Camera:
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId}`}
                </option>
              ))}
            </select>
          </label>
          <button onClick={switchCamera}>Switch Camera</button>
        </div>
      )}
    </div>
  );
};