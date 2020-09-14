import * as React from 'react';
import { ServerList } from './ServerList';
import '../css/Home.css';
import { User } from '../backend/User';

interface HomeProps
{
    user: User | undefined;
}

export class Home extends React.Component<HomeProps, {}>
{
    static displayName = Home.name;


    public render()
    {
        return (
            <div className='App'>
                <header className='App-header'>
                    <div className='flexColumn'>
                        <div>
                            {this.props.user !== undefined ?
                                <ServerList user={this.props.user} /> :
                                <h3>You're not logged in. Please do so</h3>
                            }
                        </div>
                    </div>
                </header>
            </div>
        );
    }
}
