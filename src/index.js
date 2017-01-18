import React from 'react';
import ReactDOM from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import App from './App';
import Home from './Home';
import {Router, Route, hashHistory} from 'react-router';
import './index.css';
import Auth from './Auth';

injectTapEventPlugin();

ReactDOM.render(
    <Router history={hashHistory}>
        <Route path="/" component={Home}/>
        <Route path="/admin" component={App} onEnter={()=>{if(!Auth.Login) hashHistory.push('/');}}/>
    </Router>,
  document.getElementById('root')
);
