import React, { Component } from 'react';
import { Container } from 'reactstrap';
import NavMenu from './NavMenu';
import "../css/Home.css";
import { User } from '../backend/User';
import { CookiesProvider } from 'react-cookie';
export class Layout extends Component<{}, {}>
{
    static displayName = Layout.name;

    public render()
    {
        return (
            <div className="allBackground">
                <CookiesProvider>
                    <NavMenu />
                    <Container className="container-custom">
                        {this.props.children}
                    </Container>
                </CookiesProvider>
            </div>

        );
    }
}
