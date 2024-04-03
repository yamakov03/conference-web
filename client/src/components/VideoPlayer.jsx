import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export const VideoPlayer = ({ user, isLocalUser, localUserUid, users, isReceiver, index, clickedIndex, setClickedIndex }) => {
  const ref = useRef();
  const containerRef = useRef();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('All Users');
  // const [clicked, setClicked] = useState(false);

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
      const response = await fetch(`/api/switch-camera?senderUid=${localUserUid}&recipientUid=${selectedRecipient}`, {
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

  useEffect(() => {
    async function updateViewerFocus() {
      const response = await fetch(`/api/switch-camera?senderUid=${localUserUid}&recipientUid=${selectedRecipient}`, {
        method: 'POST',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log(data);
    }
    updateViewerFocus();
  }, [selectedRecipient]);


  const toggleViewerFocus = async (uid) => {
    try {
      setSelectedRecipient((prevRecipient) => (prevRecipient === 'All Users' ? uid : 'All Users'));
    }
     catch (error) {
      console.error('Error toggling viewer focus:', error);
    }
  };

  const leaveCall = () => {
    window.location.reload();
  };

  const handleContainerClick = () => {
    if ((clickedIndex !== index) && (clickedIndex !== null)) return;
    setClickedIndex(clickedIndex === index ? null : index);
    containerRef.current.style.border = clickedIndex === index ? '5px solid green' : 'none';
  }

  const handleContainerHover = (isHovering) => {
    if (isLocalUser || clickedIndex !== null) return;
    containerRef.current.style.border = isHovering ? '5px solid blue' : containerRef.current.style.border === '5px solid green' ? '5px solid green' : 'none';
    toggleViewerFocus(user.uid);
  }
  
  useEffect(() => {
    containerRef.current.style.border = clickedIndex === index ? '5px solid green' : 'none';
  }
  , [clickedIndex]);

  return (
    <div>
      {!isLocalUser && <div>
          Uid: {user.uid}
        </div>
        }
      <div 
        className="video_player_container"
        ref={containerRef} 
        style={
          (!isLocalUser && (clickedIndex === null || clickedIndex === index)) 
            ? { cursor: 'pointer', width: 'fit-content' } 
            : { cursor: 'default' }
        }        
        onClick={!isLocalUser ? handleContainerClick : null} 
        onMouseEnter={() => handleContainerHover(true)} 
        onMouseLeave={() => handleContainerHover(false)}
      >
        <div ref={ref} style={{
          width: isLocalUser ? '200px' : isReceiver ? '300px' : '300px',
          height: isLocalUser ? '200px' : isReceiver ? '300px' : '300px',
          position: isLocalUser ? 'absolute' : 'static',
          bottom: isLocalUser ? 76 : 'auto',
          right: isLocalUser ? 0 : 'auto',
          border: isReceiver ? '5px solid red' : 'none',
        }}>
        </div>
      </div>
      <div>

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