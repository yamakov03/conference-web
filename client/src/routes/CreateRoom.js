import React from "react";
import { v1 as uuid } from "uuid";
import Button from '@mui/material/Button';

const CreateRoom = (props) => {
    function create() {
        const id = uuid();
        props.history.push(`/room/${id}`);
    }

    return (
        <Button 
            variant="contained" 
            color="primary" 
            onClick={create}
        >   
            Create Room
        </Button>
        
    ); 
}

export default CreateRoom;