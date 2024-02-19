import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { VideoPlayer } from './VideoPlayer';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const APP_ID = 'insert-app-id-here';
const TOKEN = 'insert-token-here';
const CHANNEL = 'insert-channel-here';

const client = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8',
});

export const VideoRoom = () => {
  const [users, setUsers] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

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
  };

  const unsubscribeUser = (uid) => {
    client.on('user-published', handleUserJoined);
    const user = users.find((user) => user.uid === uid);
    client.unsubscribe(user, "video");
  }

  useEffect(() => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);

    client
      .join(APP_ID, CHANNEL, TOKEN, null)
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

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 200px)',
        }}
      >
        {users.map((user) => (
          <VideoPlayer 
          key={user.uid} 
          user={user} 
          isLocalUser={user.uid === client.uid} 
          />
        ))}
      </div>
      <Select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
      >
        {users
          .filter((user) => user.uid !== client.uid)
          .map((user) => (
            <MenuItem key={user.uid} value={user.uid}>
              {user.uid}
            </MenuItem>
          ))
        }
      </Select>

      <Button onClick={() => unsubscribeUser(selectedUser)}>Unsubscribe</Button>
      
      {/* printusers: {users.map((user) => user.uid)} */}
    </div>
  );
};