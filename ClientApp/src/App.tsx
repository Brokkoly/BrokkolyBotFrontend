import React, { Component } from 'react';
import { BrowserRouter, BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
//import { ServerListAndSettingsWrapper } from './components/ServerList';
import './custom.css'
import { NavMenu } from './components/NavMenu';
import { User } from './backend/User';

export default class App extends Component<{}, { user: User | undefined }>
{
    static displayName = App.name;
    constructor(props: any)
    {
        super(props);
        this.state = { user: undefined };
    }

    public async componentDidMount()
    {
        let token = this.getTokenFromHash();
        if (token) {
            let user = await User.getUserFromToken(token);
            this.setState({ user: user });
        }
        else {
            this.setState({ user: undefined });
        }
    }
    //public async componentDidUpdate()
    //{
    //    let token = this.getTokenFromHash();
    //    if (token) {
    //        let user = await User.getUserFromToken(token);
    //        this.setState({ user: user });
    //    }
    //    else {
    //        this.setState({ user: undefined });
    //    }
    //}


    private getTokenFromHash()
    {
        var lochash = window.location.hash.substr(1),
            token = lochash.substr(lochash.search(/(?<=^|&)access_token=/))
                .split('&')[0]
                .split('=')[1];
        if (token) {
            return token;
        }
        return "";
    }

    render()
    {
        return (
            <Layout user={this.state.user}>
                <Switch>
                    <Route exact path='/' component={() => <Home user={this.state.user} />} />
                    {/*<Route path='/servers/:token?' component={ServerListAndSettingsWrapper} />*/}
                </Switch>
            </Layout >
        );
    }
}

