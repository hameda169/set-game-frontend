import React from 'react';
import { Button } from 'react-bootstrap';
import { address } from '../helpers/const';

function RoomCreate(props) {
  const goToRoom = roomId => {
    props.history.push(`/game/${roomId}`);
  };
  const onClick = form => {
    if (form === 0) {
      const name = document.getElementById('name').value;
      fetch(`${address}/room`, {
        method: 'POST',
        body: JSON.stringify({ name }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(r => r.json())
        .then(r => {
          if (r.type === 'createRoom_success') {
            goToRoom(r.room.id);
          }
        });
    }
    if (form === 1) {
      const id = document.getElementById('id').value;
      goToRoom(id);
    }
  };
  return (
    <div className={'container'}>
      <div className={'row'}>
        <div className={'col-sm-6'}>
          <div className={'create'}>
            <h2>Create Room</h2>
            <form className='form-horizontal' id={'creating'} onSubmit={() => onClick(0)}>
              <div className='form-group'>
                <label className='control-label col-sm-2'>Name:</label>
                <div className='col-sm-10'>
                  <input className='form-control' id='name' placeholder='Enter Name' name='name' />
                </div>
              </div>
              <div className='form-group'>
                <div className='col-sm-offset-2 col-sm-10'>
                  <Button onClick={() => onClick(0)}>Submit</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className={'col-sm-6'}>
          <div className={'create'}>
            <h2>Join Room</h2>
            <form className='form-horizontal' id={'joining'} onSubmit={() => onClick(1)}>
              <div className='form-group'>
                <label className='control-label col-sm-3'>Room Id:</label>
                <div className='col-sm-10'>
                  <input className='form-control' id='id' placeholder='Enter Room Id' name='id' />
                </div>
              </div>
              <div className='form-group'>
                <div className='col-sm-offset-2 col-sm-10'>
                  <Button onClick={() => onClick(1)}>Submit</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomCreate;
