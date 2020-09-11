import React, { Component } from 'react';
import { BrowserRouter, BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { ServerListAndSettingsWrapper } from './components/ServerList';
import './custom.css'
import { NavMenu } from './components/NavMenu';

export default class App extends Component
{
    static displayName = App.name;

    render()
    {
        return (
            <Layout>
                <Switch>
                    <Route exact path='/' component={Home} />
                    <Route path='/servers/:token?' component={ServerListAndSettingsWrapper} />
                </Switch>
            </Layout>
        );
    }
}

