import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { VideoPlayer } from './VideoPlayer';

const APP_ID = process.env.REACT_APP_AGORA_APP_ID

const client = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8',
});

export const VideoRoom = ({token, channel}) => {
  console.log(APP_ID, token, channel)
  const [users, setUsers] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);

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

  const unsubsribeUser = (uid) => {
    console.log("Unsub from" + uid)
    client.on('user-published', handleUserJoined);
    const user = client.remoteUsers.find((user) => user.uid === parseInt(uid));
    console.log("Unsub users array", users)
    console.log("Unsub user", user)
    if (user) client.unsubscribe(user, "video");
  }

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
          console.log('Camera switch status:', data.switched);
          // Here you can update the state or perform any other actions based on the camera switch status
          unsubsribeUser(data.switched);
          // if (camSwitchUid === null && recipientUid === null && (data.switched !== null) && (data.recipient !== null)) {
          //   setCamSwitchUid(data.switched);
          //   setRecipientUid(data.recipient);
          //   console.log('unsub sender', camSwitchUid)
          //   console.log('unsub receiver', recipientUid)
          //   unsubsribeUser(camSwitchUid)
          // }
          // if (camSwitchUid && recipientUid && (recipientUid !== client.uid) && (recipientUid !== 'All Users') && (camSwitchUid !== client.uid)) {
          //   console.log('Unsubscribing from user:', camSwitchUid);
          //   unsubsribeUser(camSwitchUid);
          // }

          let senderUid = parseInt(data.switched);
          let receiverUid = parseInt(data.recipient);

          console.log('Unsub Sender:', senderUid);
          console.log('Unsub Receiver:', receiverUid);

          if (data.switched && data.recipient){
            if ((senderUid !== client.uid) && (receiverUid !== client.uid) && (receiverUid !== 'All Users')) {
              console.log('Unsubscribing from user:',senderUid);
              unsubsribeUser(senderUid);
              }
          }
        })
        .catch(error => console.error('Error checking camera switch status:', error));
    }, 5000); // Adjust the interval as needed, here it's set to check every 5 seconds
  
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   fetch('/api/clear-switch-camera', {
  //     method: 'GET',
  //     headers: {
  //       'Access-Control-Allow-Origin': '*',
  //       'Content-Type': 'application/json',
  //     },
  //   })
  //   .then(response => {
  //     console.log('Response:', response);
  //     return response.json();
  //   })
  //   .then(data => {
  //     console.log('Camera switch status cleared:', data.message);
  //   })
  //   .catch(error => console.error('Error clearing camera switch status:', error));
  // }
  // , []);
  
  

  return (
    <div className='flex justify-center items-center'>
      <div
        className='flex flex-wrap justify-center gap-4'
        style={{ height: '80vh' }}  
      >
        {users.map((user) => (
          <VideoPlayer 
            key={user.uid} 
            user={user} 
            isLocalUser={user.uid === client.uid}
            users={users}
          />
        ))}
      </div>
      <div className='absolute bottom-[78px] start-0'>
        <p className='truncate w-[400px] cursor-pointer' onClick={() => {navigator.clipboard.writeText(channel)}}>
          Call ID: {channel}
        </p>
        <p className='truncate w-[400px] cursor-pointer' onClick={() => {navigator.clipboard.writeText(token)}}>
          Call Token: {token}
        </p>
      </div>
    </div>
  );
};