import * as React from 'react';
import { ServerList } from './ServerList';
import '../css/Home.css';
import { User } from '../backend/User';
import { Button } from 'react-bootstrap';

interface HomeProps
{
    user: User | undefined;
}

export class Home extends React.Component<HomeProps, {}>
{
    static displayName = Home.name;


    public render()
    {
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
                            {this.props.user !== undefined ?
                                <ServerList user={this.props.user} /> :
                                <Button variant="outline-light" href={discordAuthLink} >Please Log In</Button>
                            }
                        </div>
                    </div>
                </header>
            </div>
        );
    }
}
