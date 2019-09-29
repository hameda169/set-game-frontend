import React, { Component } from 'react';
import socketIOClient from 'socket.io-client';
import { Rectangle, Ellipse, Triangle } from 'react-shapes';
import { Button } from 'react-bootstrap';
import { address } from '../helpers/const';

function Card({ shape, color, num, fill, onClick, active }) {
  const cardId = `${shape}${color}${num}${fill}`;
  fill = fill === 0 ? '00' : fill === 1 ? '44' : 'cc';
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
    <div className={`game-cards ${active ? 'active' : ''}`} onClick={() => onClick(cardId)}>
      {[...Array(num)].map(() => (
        <MyShape width={90} height={50} fill={{ color: `${color}${fill}` }} stroke={{ color }} strokeWidth={5} />
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
      endpoint: address,
      cards: [],
      selected: [],
      isJoined: false,
      isStarted: false,
      userId: '',
      restricted: false,
      errorMessage: null,
    };
  }

  message_received = message => {
    console.log(message);
  };
  _join = () => {
    if (!this.state.isJoined) {
      this.socket.emit('join', { name: '', room: `${this.roomId}` });
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
      this.setState({ userId: data.id, isJoined: true });
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
    } else {
      if (data.sid === this.state.userId) {
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
                <Button disabled={this.state.isJoined} onClick={this._join}>
                  {this.state.isJoined ? `Room id: ${this.roomId}` : 'Join Room'}
                </Button>
              </div>
              <div style={{ marginTop: 20 }}>
                <Button disabled={this.state.isStarted} onClick={this._start}>
                  {this.state.isStarted ? 'Started' : 'Start Room'}
                </Button>
              </div>
              <div style={{ marginTop: 20 }}>
                <Button onClick={this._deal}>New Cards</Button>
              </div>
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
              {myArr.map(x => (
                <div className={'cards-row'}>
                  {x.map(y => {
                    const ac = this.state.selected.indexOf(y) > -1;
                    y = y.split('').map(t => parseInt(t));
                    return (
                      <Card shape={y[0]} color={y[1]} num={y[2]} fill={y[3]} active={ac} onClick={this._cardClicked} />
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
