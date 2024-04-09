import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { VideoPlayer } from './VideoPlayer';
import Tooltip from '@mui/material/Tooltip';

const APP_ID = process.env.REACT_APP_AGORA_APP_ID

const client = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8',
});

export const VideoRoom = ({ token, channel, userId }) => {
  console.log(APP_ID, token, channel)
  const [users, setUsers] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [usersViewMap, setUsersViewMap] = useState({});
  const [clickedIndex, setClickedIndex] = useState(null);

  const handleUserJoined = async (user, mediaType) => {
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
      setUsers((previousUsers) => [...previousUsers, user]);
    }

    if (mediaType === 'audio') {
      // user.audioTrack.play()
    }
  };

  const handleUserLeft = (user) => {
    setUsers((previousUsers) =>
      previousUsers.filter((u) => u.uid !== user.uid)
    );
    fetch(`/api/leave-call?uid=${user.uid}`, {
      method: 'POST',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  };

  useEffect(() => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);

    client
      .join(APP_ID, channel, token, userId)
      .then((uid) =>
        Promise.all([
          AgoraRTC.createMicrophoneAndCameraTracks(),
          uid,
        ])
      )
      .then(([tracks, uid]) => {
        const [audioTrack, videoTrack] = tracks;
        setLocalTracks(tracks);
        setUsers((previousUsers) => [
          ...previousUsers,
          {
            uid,
            videoTrack,
            audioTrack,
          },
        ]);
        client.publish(tracks);
      });

    return () => {
      for (let localTrack of localTracks) {
        if (localTrack) {
          localTrack.stop();
          localTrack.close();
        }
      }
      client.off('user-published', handleUserJoined);
      client.off('user-left', handleUserLeft);
      client.unpublish(localTracks).then(() => client.leave());
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/check-switch-camera', {
        method: 'GET',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          console.log('Response:', response);
          return response.json();
        })
        .then(data => {
          if (data.usersViewMap.length === 0) {
            return;
          }
          setUsersViewMap(data.usersViewMap[0]);

          console.log('UsersViewMap:', data.usersViewMap);

        })
        .catch(error => console.error('Error checking camera switch status:', error));
    }, 500); // Adjust the interval as needed, here it's set to check every 0.5 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='flex justify-center items-center'>
      <div className='absolute top-1 end-1 rounded-md bg-white p-2'>
        <p className='font-bold'>User Views Log</p>
        <ul>
          {
            Object.entries(usersViewMap)
              .filter(([key, value]) => key !== null && value !== null && key !== '_id' && users.map((user) => (user.uid)).includes(key))
              .slice(0, 10)
              .map(([key, value]) => (
                <li key={key}>{key} 👁️ {value}</li>
              ))
          }
        </ul>
      </div>
      <div
        className='flex flex-wrap justify-center gap-4'
        style={{ height: '80vh' }}
      >
        {users.map((user, index) => (
          <VideoPlayer
            key={user.uid}
            user={user}
            isLocalUser={user.uid === client.uid}
            localUserUid={client.uid}
            isReceiver={usersViewMap[toString(user.uid)] === toString(client.uid)}
            users={users}
            index={index}
            clickedIndex={clickedIndex}
            setClickedIndex={setClickedIndex}
          />
        ))}
      </div>


      <div className='absolute start-1 bottom-1 rounded-md bg-white p-2'>
        <Tooltip title="Copy call ID">
          <p className='font-bold truncate w-[200px] cursor-pointer hover:bg-slate-200 rounded-md p-1' data-tooltip-target="call" onClick={() => { navigator.clipboard.writeText(channel) }}>
            Call ID: {channel}
          </p>
        </Tooltip>
        <Tooltip title="Copy call token">
          <p className='font-bold truncate w-[200px] cursor-pointer hover:bg-slate-200 rounded-md p-1' data-tooltip-target="token" onClick={() => { navigator.clipboard.writeText(token) }}>
            Call Token: {token}
          </p>
        </Tooltip>

      </div>

    </div>
  );
};