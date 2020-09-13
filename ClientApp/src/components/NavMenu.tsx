import React, { Component } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarToggler, NavItem } from 'reactstrap';
import { Link } from 'react-router-dom';
import BrokkolyBanner from '../Images/BrokkolyBanner.png';
import './NavMenu.css';
import '../css/Home.css'
import { Button } from 'react-bootstrap';
import { User } from '../backend/User';
import { UserCard } from './UserCard';

export class NavMenu extends Component<{ user: User | undefined }, { collapsed: boolean }>{
    static displayName = NavMenu.name;

    constructor(props: any)
    {
        super(props);

        this.toggleNavbar = this.toggleNavbar.bind(this);
        this.state = {
            collapsed: true
        };
        this.renderUserCardOrLogin = this.renderUserCardOrLogin.bind(this);
        //this.getUserInfo = this.getUserInfo.bind(this);
    }

    //public async componentWillMount()
    //{
    //    let token = this.getTokenFromHash();
    //    if (token) {
    //        let user = await User.getUserFromToken(token);
    //    }
    //}



    //private async getUserInfo(token: string)
    //{
    //    console.log(token);
    //    const response = fetch(`https://discord.com/api/users/@me`,
    //        {
    //            method: 'GET',
    //            headers: {
    //                'Authorization': `Bearer ${token}`,
    //                'content-type': 'application/json'
    //            },

    //        }
    //    ).then( res => {
    //        console.log('our response is: ', res, res.text);
    //        return res.text;
    //    });

    //    console.log("Response: " + response);
    //    //).then(response =>
    //    //    console.log("Logged Response: " + response.text())
    //    //).catch(err => {
    //    //    console.log(err);
    //    //});
    //}


    toggleNavbar()
    {
        this.setState({
            collapsed: !this.state.collapsed
        });
    }

    private renderUserCardOrLogin(discordAuthLink: string)
    {
        return (
            this.props.user !== undefined ?
                <NavItem>
                    <UserCard userName={this.props.user?.displayName} avatarUrl={this.props.user?.avatarUrl} />
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
                        <img src={BrokkolyBanner} className="headerImg discord-fullwhite-text" alt="" />
                        <NavbarBrand className="text-light" tag={Link} to={`/`} > Brokkoly Bot</NavbarBrand>
                        < NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
                        <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!this.state.collapsed
                        } navbar>
                            <ul className="navbar-nav flex-grow" >
                                {this.renderUserCardOrLogin(discordAuthLink)}
                                <NavItem>
                                    <Button variant="outline-light"
                                        href={`https://discord.com/api/oauth2/authorize?client_id=225369871393882113&permissions=268823664&redirect_uri=${baseUrl}&scope=bot`}
                                    >Add To Your Server TODO: Move Me to the server list</Button>
                                </NavItem>

                            </ul>
                        </Collapse>
                        {

                        }

                    </Container>
                </Navbar>
            </header>
        );
    }
}
