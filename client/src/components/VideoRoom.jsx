import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { VideoPlayer } from './VideoPlayer';

const APP_ID = process.env.REACT_APP_AGORA_APP_ID

const client = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8',
});

export const VideoRoom = ({ token, channel }) => {
  console.log(APP_ID, token, channel)
  const [users, setUsers] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [usersViewMap, setUsersViewMap] = useState({});

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
      .join(APP_ID, channel, token, null)
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
    }, 1000); // Adjust the interval as needed, here it's set to check every 1 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='flex justify-center items-center'>
      <div className='absolute top-0 end-0'>
        <p>User views Log</p>
        <ul>
          {
            Object.entries(usersViewMap)
              .filter(([key, value]) => key !== null && value !== null && key !== '_id')
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
        {users.map((user) => (
          <VideoPlayer
            key={user.uid}
            user={user}
            isLocalUser={user.uid === client.uid}
            localUserUid={client.uid}
            isReceiver={usersViewMap[parseInt(user.uid)] === parseInt(client.uid)}
            users={users}
          />
        ))}
      </div>

      
      <div className='absolute bottom-[78px] start-0'>
        <p className='truncate w-[400px] cursor-pointer' onClick={() => { navigator.clipboard.writeText(channel) }}>
          Call ID: {channel}
        </p>
        <p className='truncate w-[400px] cursor-pointer' onClick={() => { navigator.clipboard.writeText(token) }}>
          Call Token: {token}
        </p>
      </div>
    </div>
  );
};