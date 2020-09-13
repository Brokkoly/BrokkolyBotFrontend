import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';
import "../css/Home.css";
import { User } from '../backend/User';

export class Layout extends Component<{ user: User | undefined }, {}>
{
    static displayName = Layout.name;

    public render()
    {
        return (
            <div className="allBackground">
                <NavMenu user={this.props.user} />
                <Container className="container-custom">
                    {this.props.children}
                </Container>
            </div>

        );
    }
}
