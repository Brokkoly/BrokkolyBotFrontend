import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';
import "../css/Home.css";

export class Layout extends Component
{
    static displayName = Layout.name;

    public render()
    {
        return (
            <div className="allBackground">
                <NavMenu />
                <Container className="container-custom">
                    {this.props.children}
                </Container>
            </div>

        );
    }
}
