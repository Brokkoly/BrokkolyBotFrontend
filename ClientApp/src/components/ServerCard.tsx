import * as React from 'react';
import "./../css/Home.css";

interface Server
{
    id: string;
    iconUrl?: string;
    name?: string;
    timeoutSeconds?: number;
    timeoutRoleId?: number;
}
interface ServerProps extends Server
{
    selected: boolean;
    onClick: Function;
}

export class ServerCard extends React.Component<ServerProps, {}> {
    render()
    {
        return (
            <div
                className={
                    "serverDiv " +
                    (this.props.selected ? "serverDivSelected" : "serverDivUnselected")
                }
                onClick={() => this.props.onClick()}
                title={this.props.name}
            >
                <img
                    className="serverImg"
                    src={this.props.iconUrl}
                    alt={this.props.name}
                />
            </div>
        );
    }
}
