import React, { useEffect, useState } from "react";
import { Commands } from "../backend/Commands";
import { IServer, Servers } from "../backend/Servers";
import { User } from "../backend/User";
import { ServerCard } from "./ServerCard";
import { Button } from 'react-bootstrap';
import { ServerSettings } from "./ServerSettings";

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


    if (typeof window !== undefined) {
        var baseUrl = window.location.protocol + '//' + window.location.host;
    }
    else {
        baseUrl = "https://localhost:44320"
    }

    function handleServerChange(index: number, newTimeoutValue: number | undefined, newBotManagerRoleId: string | undefined)
    {
        setServers(servers =>
        {
            let newList = [...servers];
            if (newTimeoutValue !== undefined) {
                newList[index].timeoutSeconds = newTimeoutValue;
            }
            else if (newBotManagerRoleId !== undefined) {
                newList[index].botManagerRoleId = newBotManagerRoleId;
            }
            return newList;
        })
    }
    function handleServerAccept()
    {

    }
    function handleServerCancel()
    {

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
                                                href={`https://discord.com/api/oauth2/authorize?client_id=225369871393882113&permissions=268823664&redirect_uri=${baseUrl}&scope=bot`}
                                            >+</Button>
                                        </li>
                                    </ul>
                                </div>
                                {selectedIndex !== -1 ?
                                    <div className="_minWidth400">
                                        <div className="_settingsDiv">


                                            <ServerSettings serverIndex={selectedIndex} server={servers[selectedIndex]} token={user.accessToken} restrictedCommands={restrictedCommands} handleServerChange={handleServerChange} handleServerAccept={handleServerAccept} handleServerCancel={handleServerCancel} />
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
                <em>Loading... If this lasts for a while, try refreshing</em>
            </p>)
            : (

                <>
                    { children}
                </>
            ));
}