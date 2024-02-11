import { useState } from 'react';
import Button from '@mui/material/Button';
import './App.css';
import { VideoRoom } from './components/VideoRoom';

function App() {
  const [joined, setJoined] = useState(false);
  return (
    <div className="App">
      <h1>WDJ Virtual Call</h1>

      {!joined && (
        <Button
          variant="contained" 
          color="primary"
          onClick={() => setJoined(true)}
        >
          Join Room
        </Button>
      )}

      {joined && <VideoRoom />}
    </div>
  );
}

export default App;