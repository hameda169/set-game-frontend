import React, { Component } from 'react';
import socketIOClient from 'socket.io-client';
import { Rectangle, Ellipse, Triangle } from 'react-shapes';
import { Button, FormText } from 'react-bootstrap';
import { address } from '../helpers/const';

function Card({ shape, color, num, fill, onClick, active, width, height, ...props }) {
  const cardId = `${shape}${color}${num}${fill}`;
  fill = fill === 0 ? '00' : fill === 1 ? '45' : 'cc';
  color = color === 0 ? '#ff0000' : color === 1 ? '#00aa00' : '#0000ff';
  num += 1;
  const MyShape = props => (
    <div>
      {shape === 0 && <Triangle {...props} />}
      {shape === 1 && <Rectangle {...props} />}
      {shape === 2 && <Ellipse {...props} rx={props.width / 2} ry={props.height / 2} />}
    </div>
  );
  return (
    <div
      {...props}
      className={`game-cards ${active ? 'active' : ''}`}
      onClick={() => onClick(cardId)}
      style={{ width: width ? 30 : null, height: height ? 50 : null }}
    >
      {[...Array(num)].map((_, idx) => (
        <MyShape
          key={`${idx}`}
          width={!width ? 90 : width}
          height={!height ? 50 : height}
          fill={{ color: `${color}${fill}` }}
          stroke={{ color }}
          strokeWidth={!height ? 5 : height / 10}
        />
      ))}
      {active && <div className={'my-badge'}>{'✓'}</div>}
    </div>
  );
}

class Game extends Component {
  constructor(props) {
    super(props);
    this.socket = null;
    this.roomId = props.match.params.id;
    this.state = {
      name: '',
      endpoint: address,
      roomName: '',
      cards: [],
      selected: [],
      isJoined: false,
      isStarted: false,
      userPublicId: '',
      userSid: '',
      restricted: false,
      errorMessage: null,
      users: {},
    };
  }

  message_received = message => {
    console.log(message);
  };
  _join = () => {
    if (this.state.name.length < 2) {
      alert('Please Enter Your Name');
      return;
    }
    if (!this.state.isJoined) {
      this.socket.emit('join', { name: this.state.name, room: `${this.roomId}` });
    } else {
      console.log('You Are joined the room');
    }
  };
  _start = () => {
    if (!this.state.isStarted) {
      this.socket.emit('start_room', { id: this.roomId });
    } else {
      console.log('Game is started');
    }
  };
  _deal = () => {
    this.socket.emit('deal', { room: this.roomId });
  };
  _challenge = cards => {
    if (!this.state.restricted && cards.length === 3) {
      this.socket.emit('challenge', { cards, room: this.roomId });
    }
    if (this.state.restricted) {
      this.setState({ selected: [] });
      console.log('You are restricted');
    }
  };
  _cardClicked = id => {
    if (this.state.selected.includes(id)) {
      this.setState({ selected: [...this.state.selected.filter(x => x !== id)] });
    } else if (this.state.cards.includes(id)) {
      this.setState({ selected: [...this.state.selected, id] }, () => this._challenge(this.state.selected));
    }
  };

  _joinResult = (status, data) => {
    console.log('Join', status, data);
    if (status === 0) {
      this.setState({ userPublicId: data.id, userSid: data.sid, isJoined: true, roomName: data.room_name });
      console.log('You joined room successfully');
    }
  };
  _initGame = data => {
    console.log('Init', data);
    this.setState({ cards: data.cards, isStarted: true });
  };
  _challengeResponse = (status, data) => {
    console.log('Challenge', status, data);
    this.setState({ selected: [] });
    if (status === 0) {
      this.setState({ cards: [...this.state.cards].filter(x => !data.cards.includes(x)), restricted: false });
      this.setState({ users: data.users });
    } else {
      if (data.id === this.state.userPublicId) {
        this.setState({ restricted: true });
      } else {
        this.setState({ restricted: false });
      }
    }
  };
  _dealResponse = (status, data) => {
    if (status === 0) {
      this.setState({ cards: [...this.state.cards, ...data.cards] });
    }
  };

  _initSocket = () => {
    this.socket = socketIOClient(this.state.endpoint);
    this.socket.on('message', this.message_received);
    this.socket.on('join_success', data => this._joinResult(0, data));
    this.socket.on('init', this._initGame);
    this.socket.on('challenge_success', data => this._challengeResponse(0, data));
    this.socket.on('challenge_fail', data => this._challengeResponse(1, data));
    this.socket.on('deal_success', data => this._dealResponse(0, data));
    this.socket.on('deal_fail', data => this._dealResponse(1, data));
  };

  nameChanged = event => {
    this.setState({ name: event.target.value });
  };
  componentDidMount() {
    fetch(`${this.state.endpoint}/room/${this.roomId}`)
      .then(r => r.json())
      .then(r => {
        console.log(r);
        if (!r.started) this._initSocket();
        else this.setState({ errorMessage: 'This room is now started' });
      });
  }

  render() {
    let rowNumber, colNumber;
    rowNumber = parseInt(Math.sqrt(this.state.cards.length) + 0.9);
    colNumber = parseInt(Math.sqrt(this.state.cards.length) + 0.9);
    const myArr = [...Array(rowNumber)].map((value, index) =>
      this.state.cards.slice(index * colNumber, colNumber * (index + 1)),
    );
    return (
      <div className={'container'}>
        {this.state.errorMessage && <div className={'row error'}>{this.state.errorMessage}</div>}
        <div className={'row'}>
          <div className={'col-sm-3'}>
            <div className={'col panel'}>
              <div>
                {!this.state.isJoined ? (
                  <form className='form-horizontal' id={'creating'} onSubmit={this._join} style={{ display: 'flex' }}>
                    <div className='form-group' style={{ flex: 1 }}>
                      <div>
                        <input className='form-control' onChange={this.nameChanged} placeholder='Enter Name' />
                      </div>
                    </div>
                    <div className='form-group'>
                      <div>
                        <Button onClick={this._join}>Join Room</Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div style={{ marginTop: 20 }}>
                    <Button disabled={this.state.isJoined}>Your Name: {this.state.name}</Button>
                  </div>
                )}
              </div>
              {this.state.isJoined && (
                <div style={{ marginTop: 20 }}>
                  <Button disabled={this.state.isJoined}>Room: {this.state.roomName}</Button>
                </div>
              )}
              {this.state.isJoined && (
                <>
                  <div style={{ marginTop: 20 }}>
                    <Button disabled={this.state.isStarted} onClick={this._start}>
                      {this.state.isStarted ? 'Started' : 'Start Room'}
                    </Button>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <Button onClick={this._deal}>New Cards</Button>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    {Object.values(this.state.users).map((x, idx) => (
                      <FormText key={`${idx}`}>{`${idx + 1}.${x.name}: ${x.scores.length}`}</FormText>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={'col-sm-9'}>
            <div
              style={{
                textAlign: 'center',
                backgroundColor: 'darkseagreen',
                width: '100%',
                minHeight: '100vh',
              }}
            >
              {myArr.map((x, idx1) => (
                <div key={`${idx1}`} className={'cards-row'}>
                  {x.map((y, idx2) => {
                    const ac = this.state.selected.indexOf(y) > -1;
                    y = y.split('').map(t => parseInt(t));
                    return (
                      <Card
                        key={`${idx2}`}
                        shape={y[0]}
                        color={y[1]}
                        num={y[2]}
                        fill={y[3]}
                        active={ac}
                        onClick={this._cardClicked}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Game;
