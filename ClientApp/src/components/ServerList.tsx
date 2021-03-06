﻿import React, { useEffect, useState } from "react";
import { Commands } from "../backend/Commands";
import { IServer, Servers } from "../backend/Servers";
import { User } from "../backend/User";
import { ServerCard } from "./ServerCard";
import { Button } from 'react-bootstrap';
import { ServerSettings } from "./ServerSettings";
import { toast } from 'react-toastify';


export interface IServerFunctions
{
    handleServerChange(args: IServerChangeArgs): void;
    handleServerAccept(index: number): void;
    handleServerCancel(index: number): void;

}

export interface IServerChangeArgs
{
    index: number;
    newTimeoutValue?: number;
    newBotManagerRoleId?: string;
    newTwitchChannelId?: string;
    newCommandPrefix?: string;
    newTwitchLiveRoleId?: string;
}

export const ServerList: React.FunctionComponent<{ user: User }> = ({ user }) =>
{
    const [loading, setLoading] = useState(true);
    const [serverLoading, setServerLoading] = useState(true);
    const [restrictedCommandsLoading, setRestrictedCommandsLoading] = useState(true);
    const [servers, setServers] = useState<IServer[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [restrictedCommands, setRestrictedCommands] = useState<string[]>([]);
    const [oldServers, setOldServers] = useState<Map<string, IServer>>(new Map<string, IServer>());

    useEffect(() =>
    {
        setLoading(serverLoading || restrictedCommandsLoading);
    }, [serverLoading, restrictedCommandsLoading]);

    useEffect(() =>
    {
        async function fetchData(token: string)
        {
            Servers.getUserGuilds(token).then(result =>
            {
                if (result?.length > 0) {
                    setServers(result);
                }
                else {
                    toast('An error ocurred when loading servers. Try refreshing, or send a support email.', {
                        autoClose: 30000,
                    });
                }
            }).then(() =>
            {
                setServerLoading(false);
            }).catch(error =>
            {
                toast('An error ocurred when loading servers. Try refreshing, or send a support email.', {
                    autoClose: 30000,
                });
            });
            Commands.getRestrictedCommands().then(result =>
            {
                if (result?.length > 0) {
                    setRestrictedCommands(result);
                }
                else {
                    toast('An error ocurred when loading settings. If this persists, consider refreshing');
                }
            }).then(() =>
            {
                setRestrictedCommandsLoading(false);
            })
            setRestrictedCommands(await Commands.getRestrictedCommands());
            setLoading(false);
        }
        if (!user?.accessToken) {
            return;
        }
        fetchData(user.accessToken);

    }, [user])

    if (typeof window !== undefined) {
        var baseUrl = window.location.protocol + '//' + window.location.host;
    }
    else {
        baseUrl = "https://localhost:44320";
    }

    function handleServerChange(args: IServerChangeArgs)
    {
        let index = args.index;
        let id = servers[index].serverId;
        if (!oldServers.has(id)) {
            let original = {
                ...servers[index]
            };
            setOldServers(oldServers =>
            {
                let newOldServers = new Map(oldServers);
                newOldServers.set(id, original);
                return newOldServers;
            });
        }
        setServers(servers =>
        {
            let newList = [...servers];
            if (args.newTimeoutValue !== undefined) {
                newList[index].timeoutSeconds = Math.trunc(args.newTimeoutValue);
            }
            else if (args.newBotManagerRoleId !== undefined) {
                newList[index].botManagerRoleId = args.newBotManagerRoleId;
            }
            else if (args.newTwitchChannelId !== undefined) {
                newList[index].twitchChannelId = args.newTwitchChannelId;
            }
            else if (args.newCommandPrefix !== undefined) {
                newList[index].commandPrefix = args.newCommandPrefix;
            }
            else if (args.newTwitchLiveRoleId !== undefined) {
                newList[index].twitchLiveRoleId = args.newTwitchLiveRoleId;
            }
            return newList;
        });
    }
    async function handleServerAccept(index: number)
    {
        //TODO: validate the variables before sending them to the server.
        Servers.putServerEdit(user.accessToken, servers[index]).then((success: boolean) =>
        {
            if (success) {
                serverAcceptSuccessCallback(index);
            }
            else {
                toast("An error ocurred while saving settings. Please try again");
            }
        })
    }

    function serverAcceptSuccessCallback(index: number)
    {
        if (oldServers.has(servers[index].serverId)) {
            setOldServers(oldServers =>
            {
                let newOldServers = new Map(oldServers);
                newOldServers.delete(servers[index].serverId);
                return newOldServers;
            });
        }
    }

    function handleServerCancel(index: number)
    {
        let id = servers[index].serverId;
        if (oldServers.has(id)) {
            setServers(servers =>
            {
                let newList = [...servers];
                //not undefined because we checked above
                let oldServer = { ...oldServers.get(id)! };
                newList[index] = oldServer;
                return newList;
            })
        }
        if (oldServers.has(servers[index].serverId)) {
            setOldServers(oldServers =>
            {
                let newOldServers = new Map(oldServers);
                newOldServers.delete(servers[index].serverId);
                return newOldServers;
            });
        }
    }

    return (
        <div className='App'>
            <header className='App-header'>
                <div className='flexColumn'>
                    <div>
                        <div className="flexRow _flexWrap">
                            <LoadingMessage loading={loading}>
                                <div>
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
                                        <li>
                                            <Button variant="outline-light"
                                                href={`https://discord.com/api/oauth2/authorize?client_id=225369871393882113&permissions=2483538033&redirect_uri=${baseUrl}&scope=applications.commands%20bot%20messages.read`}
                                            >+</Button>
                                        </li>
                                    </ul>
                                </div>
                                {selectedIndex !== -1 ?
                                    <div className="_minWidth400">
                                        <div className="_settingsDiv">


                                            <ServerSettings serverIndex={selectedIndex} server={servers[selectedIndex]} token={user.accessToken} restrictedCommands={restrictedCommands}
                                                serverFunctions={{ handleServerAccept: handleServerAccept, handleServerCancel: handleServerCancel, handleServerChange: handleServerChange }}
                                            />
                                        </div>
                                    </div>
                                    : null}
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
                <em>Loading...</em>
            </p>)
            : (

                <>
                    {children}
                </>
            ));
}
