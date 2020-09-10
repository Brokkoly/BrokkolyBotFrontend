import * as React from 'react';
import { ServerListAndSettingsWrapper } from './ServerList';
import '../css/Home.css';
import { RouteComponentProps, RouteProps, useParams } from 'react-router-dom';

interface HomeProps extends RouteProps
{
    token: string;
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
                            <h3>You're not logged in. Please do so</h3>
                        </div>
                    </div>
                </header>
            </div>
        );
    }
}
