import React, { Component } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarToggler, NavItem } from 'reactstrap';
import { Link } from 'react-router-dom';
import BrokkolyBanner from '../Images/BrokkolyBanner.png';
import './NavMenu.css';
import '../css/Home.css'
import { Button } from 'react-bootstrap';

export class NavMenu extends Component<{}, { collapsed: boolean }>{
    static displayName = NavMenu.name;

    constructor(props: any)
    {
        super(props);

        this.toggleNavbar = this.toggleNavbar.bind(this);
        this.state = {
            collapsed: true
        };
    }

    toggleNavbar()
    {
        this.setState({
            collapsed: !this.state.collapsed
        });
    }

    render()
    {
        if (typeof window !== undefined) {
            var baseUrl = window.location.protocol + '//' + window.location.host;
        }
        else {
            baseUrl = "https://localhost:44320"
        }
        const discordAuthLink = `https://discord.com/api/oauth2/authorize?client_id=730258515515408415&redirect_uri=${baseUrl}%2Fapi%2FDiscord%2FCallback&response_type=code&scope=guilds%20identify`;
        return (
            <header className="header" >
                <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" light >
                    <Container className="container-custom" >
                        <img src={BrokkolyBanner} className="headerImg discord-fullwhite-text" alt="" />
                        <NavbarBrand className="text-light" tag={Link} to={`/`} > Brokkoly Bot</NavbarBrand>
                        < NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
                        <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!this.state.collapsed
                        } navbar>
                            <ul className="navbar-nav flex-grow" >
                                <NavItem>
                                    <Button variant="outline-light" href={discordAuthLink} >Discord Login</Button>
                                </NavItem>

                                <NavItem>
                                    <Button variant="outline-light"
                                        href={`https://discord.com/api/oauth2/authorize?client_id=225369871393882113&permissions=268823664&redirect_uri=${baseUrl}&scope=bot`}
                                    >Add To Your Server</Button>
                                </NavItem>

                            </ul>
                        </Collapse>
                    </Container>
                </Navbar>
            </header>
        );
    }
}
