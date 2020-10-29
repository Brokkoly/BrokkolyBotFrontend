import * as React from 'react';
import { ServerList } from './ServerList';
import '../css/Home.css';
import { User } from '../backend/User';
import { Button } from 'react-bootstrap';
import { withCookies, Cookies } from 'react-cookie';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
interface HomeProps
{
    cookies: Cookies;
}

class Home extends React.Component<HomeProps, { user: User | undefined }>
{
    static displayName = Home.name;

    public render()
    {
        const { cookies } = this.props;
        if (typeof window !== undefined) {
            var baseUrl = window.location.protocol + '//' + window.location.host;
        }
        else {
            baseUrl = "https://localhost:44320"
        }
        const discordAuthLink = `https://discord.com/api/oauth2/authorize?response_type=token&client_id=225369871393882113&scope=identify%20guilds&redirect_uri=${baseUrl}`;
        return (
            <div className='App'>
                <header className='App-header'>
                    <div className='flexColumn'>
                        <div>
                            {cookies.get('user') !== undefined ?
                                <ServerList user={cookies.get('user')} /> :
                                <Button variant="outline-light" href={discordAuthLink} >Please Log In</Button>
                            }
                        </div>
                    </div>
                </header>
                <div>
                    I'm currently updating features, so the website may experience some instability
                </div>
                <ToastContainer
                    position="bottom-right"
                    autoClose={5000}
                    hideProgressBar
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
        );
    }
}

export default withCookies(Home);