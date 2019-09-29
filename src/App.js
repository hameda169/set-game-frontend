import React from 'react';
import { Switch, BrowserRouter, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Game from './components/Game';
import Create from './components/RoomCreate';

const App = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path={'/'} component={Create} />
        <Route strict path={'/game/:id'} component={Game} />
      </Switch>
    </BrowserRouter>
  );
};

export default App;
