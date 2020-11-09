import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { Cookies, useCookies, withCookies } from 'react-cookie';
import { Link, useHistory } from 'react-router-dom';
import { Collapse, Container, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import '../css/Home.css';
import BrokkolyBanner from '../Images/BrokkolyBanner.png';
import './NavMenu.css';
import { UserCard } from './UserCard';
interface NavMenuProps
{
    //user: User | undefined;
    cookies: Cookies;
}

export const LogoutButton: React.FunctionComponent = () =>
{
    let history = useHistory();
    // @ts-ignore ignore value assigned but never used for cookies, setCookies
    const [cookies, setCookies, removeCookie] = useCookies();
    function logoutClicked()
    {
        history.push('/');
        removeCookie('user');
    }

    return (
        <Button variant="outline-light" style={{ border: "none" }} onClick={logoutClicked} >Logout</Button>
    )

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
                <>
                    <NavItem className={"_alignSelfCenter "}>
                        <UserCard userName={user.displayName} avatarUrl={user.avatarUrl} />
                    </NavItem>
                    <NavItem className={"_alignSelfCenter _navLinkUnselected "}>
                        <LogoutButton />
                    </NavItem>
                </>
                :
                <NavItem className={"_alignSelfCenter _navLinkUnselected "}>
                    <a className={"_linkHover nav-link"} style={{ color: "#dcddde" }} href={discordAuthLink} >Discord Login</a>
                    {/*<NavLink tag={Link} href={discordAuthLink} style={{ color: "#dcddde" }} className="_linkHover">
                        Discord Login
                    </NavLink>*/}
                    {/*<Button variant="outline-light" href={discordAuthLink} >Discord Login</Button>*/}
                </NavItem>
        )
    }

    render()
    {
        if (typeof window !== undefined) {
            var baseUrl = window.location.protocol + '//' + window.location.host;
        }
        else {
            baseUrl = "https://localhost:44320";
        }
        const discordAuthLink = `https://discord.com/api/oauth2/authorize?response_type=token&client_id=225369871393882113&scope=identify%20guilds&redirect_uri=${baseUrl}`;
        return (
            <header className="header" >
                <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" light >
                    <Container className="container-custom" >
                        <img src={BrokkolyBanner} className="headerImg textColor" alt="" />
                        <NavbarBrand className="textColor" tag={Link} to={`/`} > Brokkoly Bot</NavbarBrand>
                        <NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
                        <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!this.state.collapsed
                        } navbar>
                            <ul className="navbar-nav flex-grow" >
                                <NavItem className={"_alignSelfCenter _navLinkUnselected "}>
                                    <NavLink tag={Link} to="/" style={{ color: "#dcddde" }} className="_linkHover">
                                        My Servers
                                    </NavLink>
                                </NavItem>
                                <NavItem className={"_alignSelfCenter _navLinkUnselected "}>
                                    <NavLink tag={Link} to="/about" style={{ color: "#dcddde" }} className="_linkHover">
                                        About
                                    </NavLink>
                                </NavItem>
                                <NavItem className={"_alignSelfCenter _navLinkUnselected "}>
                                    <NavLink tag={Link} to="/help" style={{ color: "#dcddde" }} className="_linkHover">
                                        Help
                                    </NavLink>
                                </NavItem>
                                <NavItem className={"_alignSelfCenter _navLinkUnselected "}>
                                    <NavLink tag={Link} to="/utilities" style={{ color: "#dcddde" }} className="_linkHover">
                                        Utilities
                                    </NavLink>
                                </NavItem>
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