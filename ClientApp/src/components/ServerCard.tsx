import * as React from 'react';
//import React, { Component } from "react";
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
            >
                <img
                    className="serverImg"
                    src={this.props.iconUrl}
                    alt={"Server Image for " + this.props.name}
                />
                <span className={"serverName " + (this.props.selected ? "serverNameSelected" : "")}>{this.props.name}</span>
                <span
                    className={"selectedIconDiv " + (this.props.selected ? "" : "nodisp")}
                >
                    {">"}
                </span>
            </div>
        );
    }
}
