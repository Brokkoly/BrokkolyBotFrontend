import React, { Component } from 'react';
import { CookiesProvider } from 'react-cookie';
import { Container } from 'reactstrap';
import "../css/Home.css";
import NavMenu from './NavMenu';
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
