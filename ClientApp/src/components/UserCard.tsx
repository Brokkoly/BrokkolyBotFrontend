﻿import React from 'react';
import '../css/Home.css';

export class UserCard extends React.Component<{ userName: string | undefined, avatarUrl: string | undefined }, {}>{
    public render()
    {
        return (
            <div>
                <img src={this.props.avatarUrl} className="headerImg" alt="User's Avatar" />
                <span className="textColor">{this.props.userName}</span>
            </div>
        )
    }
}