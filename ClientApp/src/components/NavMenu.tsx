import React, { Component } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarToggler, NavItem } from 'reactstrap';
import { Link } from 'react-router-dom';
import BrokkolyBanner from '../Images/BrokkolyBanner.png';
import './NavMenu.css';
import '../css/Home.css'
import { Button } from 'react-bootstrap';
import { User } from '../backend/User';
import { UserCard } from './UserCard';
import { withCookies, Cookies } from 'react-cookie';
interface NavMenuProps
{
    //user: User | undefined;
    cookies: Cookies;
}
class NavMenu extends Component<NavMenuProps, { collapsed: boolean }>{
    static displayName = NavMenu.name;

    constructor(props: any)
    {
        super(props);
        
        this.toggleNavbar = this.toggleNavbar.bind(this);
        this.state = {
            collapsed: true,
        };
        this.renderUserCardOrLogin = this.renderUserCardOrLogin.bind(this);
    }

    toggleNavbar()
    {
        this.setState({
            collapsed: !this.state.collapsed
        });
    }

    private renderUserCardOrLogin(discordAuthLink: string)
    {
        const { cookies } = this.props;
        let user = cookies.get('user');
        return (
            user !== undefined ?
                <NavItem>
                    <UserCard userName={user.displayName} avatarUrl={user.avatarUrl} />
                </NavItem>
                :
                <NavItem>
                    <Button variant="outline-light" href={discordAuthLink} >Discord Login</Button>
                </NavItem>
        )
    }

    render()
    {
        if (typeof window !== undefined) {
            var baseUrl = window.location.protocol + '//' + window.location.host;
        }
        else {
            baseUrl = "https://localhost:44320"
        }
        const discordAuthLink = `https://discord.com/api/oauth2/authorize?response_type=token&client_id=225369871393882113&scope=identify%20guilds&redirect_uri=${baseUrl}`;
        return (
            <header className="header" >
                <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" light >
                    <Container className="container-custom" >
                        <img src={BrokkolyBanner} className="headerImg textColor" alt="" />
                        <NavbarBrand className="textColor" tag={Link} to={`/`} > Brokkoly Bot</NavbarBrand>
                        < NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
                        <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!this.state.collapsed
                        } navbar>
                            <ul className="navbar-nav flex-grow" >
                                {this.renderUserCardOrLogin(discordAuthLink)}
                            </ul>
                        </Collapse>
                    </Container>
                </Navbar>
            </header>
        );
    }
}

export default withCookies(NavMenu);