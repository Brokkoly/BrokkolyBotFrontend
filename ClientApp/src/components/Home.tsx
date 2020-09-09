import * as React from 'react';
import { ServerListAndSettingsWrapper } from './ServerList';
import '../css/Home.css';

export class Home extends React.Component
{
    static displayName = Home.name;

    public render()
    {
        return (
            <div className='App'>
                <header className='App-header'>
                    <div className='flexColumn'>
                        <ServerListAndSettingsWrapper />
                    </div>
                </header>
            </div>
        );
    }
}
