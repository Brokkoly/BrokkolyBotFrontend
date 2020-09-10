import React, { Component } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import BrokkolyBanner from '../Images/BrokkolyBanner.png';
import './NavMenu.css';
import '../css/Home.css'
import { ClientID, ClientSecret } from '../Secrets';

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
        const discordAuthLink = `https://discord.com/api/oauth2/authorize?client_id=${ClientID}&redirect_uri=https%3A%2F%2Flocalhost%3A44320%2Fapi%2Fdiscord%2Fcallback&response_type=code&scope=guilds%20identify`;
        return (
            <header className="header" >
                <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" light >
                    <Container className="container-custom" >
                        <img src={BrokkolyBanner} className="headerImg discord-fullwhite-text" alt="" />
                        <NavbarBrand className="discord-fullwhite-text" tag={Link} to={`/`} > Brokkoly Bot</NavbarBrand>
                        < NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
                        <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!this.state.collapsed
                        } navbar>
                            <ul className="navbar-nav flex-grow" >
                                <NavItem>
                                    <NavLink tag={Link} className="discord-fullwhite-text" to="/ServerListAndSettingsWrapper" > Servers </NavLink>
                                </NavItem>
                                <NavItem>
                                    <a className="discord-fullwhite-text" href={discordAuthLink}>Discord Authorization</a>
                                </NavItem>

                                <NavItem >
                                    <a className="discord-fullwhite-text" href="https://discord.com/api/oauth2/authorize?client_id=225369871393882113&permissions=268823664&redirect_uri=https%3A%2F%2Flocalhost%3A44320%2F&scope=bot" > Add To Your Server </a>
                                </NavItem>
                                
                            </ul>
                        </Collapse>
                    </Container>
                </Navbar>
            </header>
        );
    }
}
