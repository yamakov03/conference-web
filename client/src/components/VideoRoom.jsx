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
    const user = client.remoteUsers.find((user) => user.uid === uid);
    console.log("Unsub users array", users)
    console.log("Unsub user", user)
    if (user) client.unsubscribe(user, "video");
  }

  const massUnsubscribeUsers = (uid) => {
    client.on('user-published', handleUserJoined);
    const unsubUsers = client.remoteUsers.filter((user) => user.uid !== uid);
    const unsubUsersList = unsubUsers.map((user) => ({user: user, mediaType: "video"}));
    console.log("Unsub multiple users array filtered", unsubUsers)
    console.log("Unsub multiple users array", unsubUsersList)
    client.massUnsubscribe(unsubUsersList);
  }

  const subscribeUser = (uid) => {
    // client.on('user-published', handleUserJoined);
    const user = client.remoteUsers.find((user) => user.uid === uid);
    if (user) client.subscribe(user, "video");
  }

  const massSubscribeUsers = async(uid) => {
    // client.on('user-published', handleUserJoined);
    const subUsers = client.remoteUsers.filter((user) => user.uid !== uid);
    
    // if (subUsers[0]) {
    //   await client.subscribe(subUsers[0], "video");
    //   subUsers[0].videoTrack.play();}
    // const subUsersList = subUsers.map((user) => ({user: user, mediaType: "video"}));
    // console.log("Sub multiple users array filtered", subUsers)
    // const videoContainer = document.querySelector('.agora_video_player');

    // if (videoContainer) {
    //     // .video-container element exists
    //     console.log('.video-container element exists');
    // } else {
    //     // .video-container element does not exist
    //     console.log('.video-container element does not exist');
    // }

    // const result = await client.massSubscribe(subUsersList);
    // for (const {track, mediaType, error} of result) {
    //   if (error) {
    //     console.error('Failed to subscribe to user', error);
    //     continue;
    //   }
    //   if (mediaType === 'video') {
    //     console.log('paused:', track.paused);
    //     track.play(videoContainer);
    //     // if (videoContainer.paused){
    //     //     track.play(videoContainer);
    //     // }
    //   }
    // }
    // client.massSubscribe(subUsersList)
    //   .then(result => {
    //     for (const {track, mediaType, error} of result) {
    //       if (error) {
    //         console.error('Failed to subscribe to user', error);
    //         continue;
    //       }
    //       if (mediaType === 'video') {
    //         console.log('paused:', track.paused);
    //         track.play(videoContainer);
    //         // if (videoContainer.paused){
    //         //     track.play(videoContainer);
    //         // }
            
    //       }
    //     }
    //   })
    //   .catch(error => {
    //     console.error('Error while subscribing to users:', error);
    //   });
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
          // unsubsribeUser(data.switched);
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
          let receiverUid = data.recipient;
          if (data.recipient !== "All Users") {
            receiverUid = parseInt(data.recipient);
          }

          console.log('Unsub Sender:', senderUid);
          console.log('Unsub Receiver:', receiverUid);

          if (data.switched && data.recipient){
            if ((senderUid !== client.uid) && (receiverUid !== client.uid) && (receiverUid !== 'All Users')) {
              console.log('Unsubscribing from user:', senderUid);
              // massSubscribeUsers(senderUid);
              unsubsribeUser(senderUid);
              }
            if ((senderUid !== client.uid) && (receiverUid === client.uid)) {
              console.log('Unsubscribing from multiple users:', senderUid);
              // subscribeUser(senderUid);
              massUnsubscribeUsers(senderUid);
            }
            // if (receiverUid === "All Users"){
            //   massSubscribeUsers("");
            // }
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