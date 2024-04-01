import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import VisibilityIcon from '@mui/icons-material/Visibility';

export const VideoPlayer = ({ user, isLocalUser, localUserUid, users, isReceiver }) => {
  const ref = useRef();
  const containerRef = useRef();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('All Users');
  const [clicked, setClicked] = useState(false);

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
        // Toggle the clicked state for this video
        setClicked(!clicked);
        // Remove the green border from all other videos
        const videos = document.querySelectorAll('.video_player_container');
        console.log("videos in handle: ", videos);
        videos.forEach((video) => {
          console.log("video in handle border: ", video, video.style.border);
          if (video !== containerRef.current && video.style.border === '5px solid green') {
            video.style.border = 'none';
          }
        });
        // Toggle the green border for this video
        containerRef.current.style.border = clicked ? '5px solid green' : 'none';
        toggleViewerFocus(user.uid);
  }

  const handleContainerHover = (isHovering) => {
    containerRef.current.style.border = isHovering ? '5px solid blue' : clicked ? '5px solid green' : 'none';
  }

  return (
    <div>
      {!isLocalUser && <div>
          Uid: {user.uid}
        </div>
        }
      <div 
        className="video_player_container"
        ref={containerRef} 
        style={{ cursor: 'pointer', width: 'fit-content' }} 
        onClick={handleContainerClick} 
        onMouseEnter={() => handleContainerHover(true)} 
        onMouseLeave={() => handleContainerHover(false)}
      >
        <div ref={ref} style={{
          width: isLocalUser ? '200px' : isReceiver ? '400px' : '300px',
          height: isLocalUser ? '200px' : isReceiver ? '400px' : '300px',
          position: isLocalUser ? 'absolute' : 'static',
          bottom: isLocalUser ? 76 : 'auto',
          right: isLocalUser ? 0 : 'auto',
          border: isReceiver ? '10px solid red' : 'none',
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