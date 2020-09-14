import React, { ReactNode, useEffect, useState } from "react";
import { RouteComponentProps, RouteProps } from "react-router-dom";
import { ServerCard } from "./ServerCard";
import { ServerSettings } from "./ServerSettings";
import { IServer, Servers } from "../backend/Servers";
import { IUser, User } from "../backend/User";
import { Commands } from "../backend/Commands";
import { Server } from "net";
import { load } from "dotenv/types";
//import { Link, NavLink } from 'react-router-dom';





interface ServerListProperties
{
    selectIdFunction: Function;
    selectedId: string;
    user: User;
}

interface ServerListDataState
{
    serverList: IServer[];
    restrictedCommands: string[];
    loading: boolean;
}

interface WrapperProps
{
    user: User;

}

interface WrapperState
{
    selectedId: string;
}

//export class ServerListAndSettingsWrapper extends React.Component<WrapperProps, WrapperState>
//{
//    constructor(props: any)
//    {
//        super(props);
//        this.serverClicked = this.serverClicked.bind(this);
//        this.state = { selectedId: "0" };
//    }

//    private serverClicked(id: string)
//    {
//        if (!id) {
//            this.setState({ selectedId: "0" });
//        }
//        this.setState({ selectedId: id });
//    }

//    public render()
//    {
//        return (
//            <div className='App'>
//                <header className='App-header'>
//                    <div className='flexColumn'>
//                        <div>
//                            <div className="flexRow">
//                                <ServerList selectedId={this.state.selectedId} selectIdFunction={this.serverClicked} user={this.props.user} />
//                                {this.state.selectedId !== "0" ?
//                                    <ServerSettings selectedId={this.state.selectedId} token={this.props.user.accessToken} /> : null}
//                            </div>
//                        </div>
//                    </div>
//                </header>
//            </div>);
//    }
//}

//interface IServerListProps
//{
//    user: string;
//}

export const ServerList: React.FunctionComponent<{ user: User }> = ({ user }) =>
{
    const [loading, setLoading] = useState(true);
    const [servers, setServers] = useState<IServer[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [restrictedCommands, setRestrictedCommands] = useState<string[]>([]);

    useEffect(() =>
    {
        async function fetchData(token: string)
        {
            setServers(await Servers.getUserGuilds(token));
            setRestrictedCommands(await Commands.getRestrictedCommands());
            setLoading(false);
        }
        if (!user?.accessToken) {
            return;
        }
        fetchData(user.accessToken);

    }, [user])


    return (
        <div className='App'>
            <header className='App-header'>
                <div className='flexColumn'>
                    <div>
                        <div className="flexRow">
                            <LoadingMessage loading={loading}>
                                <ul className="serverList">
                                    {servers.map((srv, index) => (
                                        <ServerCard key={srv.serverId}
                                            id={srv.serverId}
                                            iconUrl={srv.iconUrl64}
                                            name={srv.name}
                                            timeoutRoleId={srv.timeoutRoleId}
                                            timeoutSeconds={srv.timeoutSeconds}
                                            selected={index === selectedIndex}
                                            onClick={() => setSelectedIndex(index)}
                                        />
                                    ))
                                    }
                                </ul>
                                {selectedIndex !== -1 ?
                                    <ServerSettings server={servers[selectedIndex]} token={user.accessToken} restrictedCommands={restrictedCommands} /> : null}
                            </LoadingMessage>
                        </div>
                    </div>
                </div>
            </header>
        </div>);
}

export const LoadingMessage: React.FunctionComponent<{ loading: boolean }> = ({ loading, children }) =>
{
    return (
        loading ? (
            <p>
                {/*TODO: automatically try refreshing if it takes too long*/}
                <em>Loading... If this lasts for a while, try refreshing</em>
            </p>)
            : (
                //: this.state.text;
                <>
                    { children}
                </>
            ));
}
//export class ServerListParent
//{
//    public static ServerListParent(user: User)
//    {
//        const [loading, setLoading] = useState(true);
//        const [servers, setServers] = useState<IServer[]>([]);
//        const [selectedId, setSelectedId] = useState("");
//        const [restrictedCommands, setRestrictedCommands] = useState<string[]>([]);

//        useEffect(() =>
//        {
//            async function fetchData(token: string)
//            {
//                const serverData = await Servers.getUserGuilds(token);
//                setServers(serverData);
//                const restrictedCommandData = await Commands.getRestrictedCommands();
//                setRestrictedCommands(restrictedCommandData);
//            }
//            fetchData(user.accessToken);
//            setLoading(false);

//        }, [user])


//        return (
//            <div className='App'>
//                <header className='App-header'>
//                    <div className='flexColumn'>
//                        <div>
//                            <div className="flexRow">
//                                <ServerListParent.LoadingMessage loading={loading}>
//                                    <ul className="serverList">
//                                        {servers.map(srv => (
//                                            <ServerCard key={srv.serverId}
//                                                id={srv.serverId}
//                                                iconUrl={srv.iconUrl64}
//                                                name={srv.name}
//                                                timeoutRoleId={srv.timeoutRoleId}
//                                                timeoutSeconds={srv.timeoutSeconds}
//                                                selected={srv.serverId === selectedId}
//                                                onClick={() => setSelectedId(srv.serverId)}
//                                            />
//                                        ))
//                                        }
//                                    </ul>
//                                </ServerListParent.LoadingMessage>
//                            </div>
//                        </div>
//                    </div>
//                </header>
//            </div>);

//    }

//    public static LoadingMessage(props: React.PropsWithChildren<{ loading: boolean }>)
//    {
//        return (
//            props.loading ? (
//                <p>
//                    {/*TODO: automatically try refreshing if it takes too long*/}
//                    <em>Loading... If this lasts for a while, try refreshing</em>
//                </p>)
//                : (
//                    //: this.state.text;
//                    <>
//                        { props.children}
//                    </>
//                ));
//    }
//}
export interface ILoadingProps
{
    loading: boolean;
    children: React.ReactNode;
}





//export class ServerList extends React.Component<ServerListProperties, ServerListDataState> {
//    constructor(props: any)
//    {
//        super(props);
//        this.state = { serverList: [], restrictedCommands: [], loading: true };
//        //this.getRestrictedCommands = this.getRestrictedCommands.bind(this);


//        //fetch('api/Servers/Index', {
//        //    method: 'GET',
//        //})
//        //    .then(response =>
//        //    {
//        //        //console.log(response.text());
//        //        return response.json() as Promise<Server[]>
//        //    })
//        //    .then(data =>
//        //    {
//        //        console.log(data);
//        //        this.setState({ serverList: data, text: data.toString(), loading: false });
//        //    })
//    }



//    public async componentDidMount()
//    {
//        await Servers.getRestrictedCommands();
//        const result = await fetch(
//            //"https://localhost:44320/api/Servers/GetServerList?id=${}"
//            `/api/Servers/GetServerListForUser?token=${this.props.user.accessToken}`
//        );
//        const text = await result.text();
//        const servers = await JSON.parse(text.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));
//        //TODO: make this better
//        const serversTransformed: IServer[] = servers.map((srv: any) => 
//        {
//            return {
//                serverId: srv.id,
//                name: srv.name,
//                timeoutSeconds: srv.timeout_seconds,
//                timeoutRoleId: srv.timeout_role_id,
//                iconUrl64: Servers.constructUrlsForServerIcon(srv.id, srv.icon),
//            }
//        });
//        this.setState({ serverList: serversTransformed, loading: false });
//    }





//    public render()
//    {
//        let contents = this.state.loading ? (
//            <p>
//                {/*TODO: automatically try refreshing if it takes too long*/}
//                <em>Loading... If this lasts for a while, try refreshing</em>
//            </p>
//        ) : (
//                //: this.state.text;
//                this.renderServerList(this.state.serverList)
//            );

//        return <div>{contents}</div>;
//    }

//    public renderServerTable(serverList: IServer[])
//    {
//        return (
//            <>

//                <table className="table">
//                    <thead>
//                        <tr>
//                            <th />
//                            <th>Server Id</th>
//                            <th>Timeout Seconds</th>
//                            <th>Timeout Role Id</th>
//                        </tr>
//                    </thead>
//                    <tbody>
//                        {serverList.map(srv => (
//                            <tr key={srv.serverId}>
//                                <td />
//                                <td>{srv.serverId}</td>
//                                <td>{srv.timeoutSeconds}</td>
//                                <td>{srv.timeoutRoleId}</td>

//                                {/*<td>
//                            <a className="action" onClick={(id) => this.handleEdit(emp.employeeId)}>Edit</a>  |
//                            <a className="action" onClick={(id) => this.handleDelete(emp.employeeId)}>Delete</a>
//                        </td>
//                        */}
//                            </tr>
//                        ))}
//                    </tbody>
//                </table>
//            </>
//        );
//    }

//    public renderServerList(serverList: IServer[])
//    {
//        return (
//            <div>
//                {/*<span>{this.state.selectedId}</span>*/}

//                <ul className="serverList">
//                    {serverList.map(srv => (
//                        <ServerCard key={srv.serverId}
//                            id={srv.serverId}
//                            iconUrl={srv.iconUrl64}
//                            name={srv.name}
//                            timeoutRoleId={srv.timeoutRoleId}
//                            timeoutSeconds={srv.timeoutSeconds}
//                            selected={srv.serverId === this.props.selectedId}
//                            onClick={() => this.props.selectIdFunction(srv.serverId)}
//                        />
//                    ))
//                    }
//                </ul>
//            </div>
//        );
//    }
//}
