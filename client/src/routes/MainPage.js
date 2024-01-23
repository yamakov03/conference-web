import React, { useState } from 'react';
import { Button, Box, Container, TextField, Typography } from '@material-ui/core';
import { v1 as uuid } from "uuid";

const MainPage = (props) => {
    const [roomId, setRoomId] = useState('');

    function createRoom() {
        const id = uuid();
        props.history.push(`/room/${id}`);
    }

    function joinRoom() {
        props.history.push(`/room/${roomId}`);
    }

    return (
        <Container maxWidth="sm">
            <Typography variant="h1" align="center">
                Video Chat
            </Typography>
            <Box display="flex" justifyContent="center">
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={createRoom}
                    style={{ padding: '15px', margin: '10px'}}
                >   
                    Create Room
                </Button>
            </Box>
            <Box display="flex" justifyContent="center">
                <TextField 
                    label="Room ID" 
                    variant="outlined" 
                    value={roomId} 
                    onChange={(e) => setRoomId(e.target.value)}
                    style={{ margin: '10px' }}
                />
                <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={joinRoom}
                    style={{ margin: '10px' }}
                >   
                    Join Room
                </Button>
            </Box>

            
        </Container>
    ); 
}

export default MainPage;