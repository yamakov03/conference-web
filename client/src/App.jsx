import { useState } from 'react';
import Button from '@mui/material/Button';
import { Input } from '@mui/material';
import './App.css';
import { VideoRoom } from './components/VideoRoom';

function App() {
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState("");
  const [channel, setChannel] = useState("");
  const [user, setUser] = useState("");

  const createRoom = async (event) => {
    event.preventDefault();
    const channelId = channel || Math.random().toString(36).substring(2, 15);
    const userId = user || Math.random().toString(36).substring(2, 15);
    
    const response = await fetch(`/api/token?channelId=${channelId}`, {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
      }
    });
    const { token } = await response.json();

    setToken(token);
    setChannel(channelId);
    setUser(userId);
    setJoined(true);
  };

  const joinExistingRoom = async (event) => {
    event.preventDefault();
    const userId = user || Math.random().toString(36).substring(2, 15);
    setUser(userId);
    setJoined(true);
  };

  return (
    <div className='bg-gray-200 h-screen' >
      <div className="flex flex-col items-center gap-3 ">
        <h1 className='py-2 text-2xl font-bold text-white text-center bg-gray-700 w-full'>LiteGaze</h1>
        {!joined && (
          <div className='flex flex-col items-center gap-3'>
            <form onSubmit={createRoom} className='gap-3 flex-col flex'>
              <Input
                type="text"
                name="channelId"
                placeholder="Call ID (optional)"
                onChange={(e) => setChannel(e.target.value)}
              />
              <Input
                type="text"
                name="userId"
                placeholder="User ID (optional)"
                onChange={(e) => setUser(e.target.value)}
              />
              <Button type="submit" variant="contained">Create Room</Button>
            </form>

            <p>or</p>

            <form onSubmit={joinExistingRoom} className='gap-3 flex-col flex'>
              <Input
                type="text"
                name="channelId"
                placeholder="Call ID"
                onChange={(e) => setChannel(e.target.value)}
              />
              <Input
                type="text"
                name="token"
                placeholder="Call Token"
                onChange={(e) => setToken(e.target.value)}
              />
              <Input
                type="text"
                name="userId"
                placeholder="User ID (optional)"
                onChange={(e) => setUser(e.target.value)}
              />
              <Button type="submit" variant="contained">Join Room</Button>
            </form>
          </div>
        )}
      </div>

      {joined && <VideoRoom token={token} channel={channel} userId={user} />}
    </div>
  );
}

export default App;