import * as React from "react";
import { RouteComponentProps, RouteProps } from "react-router-dom";
import { ServerCard } from "./ServerCard";
import { ServerSettings } from "./ServerSettings";
//import { Link, NavLink } from 'react-router-dom';

export class Server
{
    serverId: string = "0";
    timeoutSeconds?: number = 0;
    timeoutRoleId?: number = 0;
    iconUrl64?: string = "";
    name?: string = "";
}

interface RestrictedCommand
{
    id: number;
    command: string;
}

interface ServerListProperties
{
    selectIdFunction: Function;
    selectedId: string;
}

interface ServerListDataState
{
    serverList: Server[];
    restrictedCommands: string[];
    loading: boolean;
}

interface WrapperProps extends RouteComponentProps<WrapperParams>
{
}
interface WrapperParams
{
    token: string;

}

interface WrapperState
{
    selectedId: string;
}

export class ServerListAndSettingsWrapper extends React.Component<WrapperProps, WrapperState>
{
    constructor(props: any)
    {
        super(props);
        this.serverClicked = this.serverClicked.bind(this);
        this.state = { selectedId: "0" };
    }

    private serverClicked(id: string)
    {
        if (!id) {
            this.setState({ selectedId: "0" });
        }
        this.setState({ selectedId: id });
    }

    public render()
    {
        return (
            <div className='App'>
                <header className='App-header'>
                    <div className='flexColumn'>
                        <div>
                            <div className="flexRow">
                                <ServerList selectedId={this.state.selectedId} selectIdFunction={this.serverClicked} />
                                {this.state.selectedId !== "0" ?
                                    <ServerSettings selectedId={this.state.selectedId} token={this.props.match.params.token} /> : undefined}
                            </div>
                        </div>
                    </div>
                </header>
            </div>);
    }
}

export class ServerList extends React.Component<ServerListProperties, ServerListDataState> {
    constructor(props: any)
    {
        super(props);
        this.state = { serverList: [], restrictedCommands: [], loading: true };
        this.getRestrictedCommands = this.getRestrictedCommands.bind(this);


        //fetch('api/Servers/Index', {
        //    method: 'GET',
        //})
        //    .then(response =>
        //    {
        //        //console.log(response.text());
        //        return response.json() as Promise<Server[]>
        //    })
        //    .then(data =>
        //    {
        //        console.log(data);
        //        this.setState({ serverList: data, text: data.toString(), loading: false });
        //    })
    }

    public async componentDidMount()
    {
        await this.getRestrictedCommands();
        const result = await fetch(
            //"https://localhost:44320/api/Servers/GetServerList"
            "/api/Servers/GetServerList"
        );
        const text = await result.text();
        const servers = await JSON.parse(text.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));
        this.setState({ serverList: servers, loading: false });
    }

    public async getRestrictedCommands()
    {
        let fetchUrl = '/api/RestrictedCommands/GetRestrictedCommands';
        await fetch(fetchUrl).then(
            response => response.json()
        ).then(data => this.setState(
            { restrictedCommands: data.map((restrictedCommand: RestrictedCommand) => (restrictedCommand.command)) }));
    }

    public render()
    {
        let contents = this.state.loading ? (
            <p>
                <em>Loading...</em>
            </p>
        ) : (
                //: this.state.text;
                this.renderServerList(this.state.serverList)
            );

        return <div>{contents}</div>;
    }

    public renderServerTable(serverList: Server[])
    {
        return (
            <>

                <table className="table">
                    <thead>
                        <tr>
                            <th />
                            <th>Server Id</th>
                            <th>Timeout Seconds</th>
                            <th>Timeout Role Id</th>
                        </tr>
                    </thead>
                    <tbody>
                        {serverList.map(srv => (
                            <tr key={srv.serverId}>
                                <td />
                                <td>{srv.serverId}</td>
                                <td>{srv.timeoutSeconds}</td>
                                <td>{srv.timeoutRoleId}</td>

                                {/*<td>
                            <a className="action" onClick={(id) => this.handleEdit(emp.employeeId)}>Edit</a>  |
                            <a className="action" onClick={(id) => this.handleDelete(emp.employeeId)}>Delete</a>
                        </td>
                        */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    }

    public renderServerList(serverList: Server[])
    {
        return (
            <div>
                {/*<span>{this.state.selectedId}</span>*/}

                <ul className="serverList">
                    {serverList.map(srv => (
                        <ServerCard key={srv.serverId}
                            id={srv.serverId}
                            iconUrl={srv.iconUrl64}
                            name={srv.name}
                            timeoutRoleId={srv.timeoutRoleId}
                            timeoutSeconds={srv.timeoutSeconds}
                            selected={srv.serverId === this.props.selectedId}
                            onClick={() => this.props.selectIdFunction(srv.serverId)}
                        />
                    ))
                    }
                </ul>
            </div>
        );
    }
}
