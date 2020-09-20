import React, { Component } from 'react';
import { Cookies, withCookies } from 'react-cookie';
import { Route, Switch } from 'react-router-dom';
import { User } from './backend/User';
import Home from './components/Home';
import { Layout } from './components/Layout';
//import { ServerListAndSettingsWrapper } from './components/ServerList';
import './custom.css';

class App extends Component<{ cookies: Cookies }>
{
    constructor(props: any)
    {
        super(props);

        this.state = { user: undefined };
    }

    public async componentDidMount()
    {
        //let token = this.getTokenFromHash();
        //if (token) {

        await this.getUserFromHashOrCookie();
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

    private async getUserFromHashOrCookie()
    {
        const { cookies } = this.props;
        let newUser: User | undefined = undefined;
        newUser = cookies.get('user');
        if (!newUser) {

            var lochash = window.location.hash.substr(1),
                token = lochash.substr(lochash.search(/(?<=^|&)access_token=/))
                    .split('&')[0]
                    .split('=')[1],
                expires_in = lochash.substr(lochash.search(/(?<=^|&)expires_in=/))
                    .split('&')[0]
                    .split('=')[1];
            if (token && expires_in) {
                let user = await User.getUserFromToken(token);
                cookies.set('user', user, { maxAge: Number(expires_in) });
            }
        }

        return newUser;
    }

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
            <>
                {/*<ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover>*/}
                < Layout >
                    <Switch>
                        <Route exact path='/' component={Home} />
                        {/*<Route path='/servers/:token?' component={ServerListAndSettingsWrapper} />*/}
                    </Switch>
                    
                </Layout >
                {/*</ToastContainer>*/}
            </>
        );
    }
}

export default withCookies(App);