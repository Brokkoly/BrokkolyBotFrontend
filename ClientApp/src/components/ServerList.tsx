import React, { useEffect, useState } from "react";
import { Commands } from "../backend/Commands";
import { IServer, Servers } from "../backend/Servers";
import { User } from "../backend/User";
import { ServerCard } from "./ServerCard";
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
                <>
                    { children}
                </>
            ));
}