import React, { useEffect, useState } from 'react';
import { Commands, ICommand } from '../backend/Commands';
import { IServer } from '../backend/Servers';
import { CommandRow } from './CommandRow';
import { LoadingMessage } from './ServerList';


interface ServerSettingsProps
{
    token: string;
    server: IServer;
    restrictedCommands: string[];
    handleServerChange: Function;
}

export const ServerSettings: React.FunctionComponent<ServerSettingsProps> = ({ server, token, restrictedCommands, handleServerChange }) =>
{
    const [commandList, setCommandList] = useState<ICommand[]>([]);
    const [oldCommands, setOldCommands] = useState<Map<number, ICommand>>(new Map<number, ICommand>());
    const [timeoutSeconds, setTimeoutSeconds] = useState(5);
    const [loading, setLoading] = useState(true);
    const [nextTempId, setNextTempId] = useState(-2);

    useEffect(() =>
    {
        async function fetchData(serverId: string)
        {
            let newCommandList = await Commands.fetchCommands(serverId);
            if (server.userCanManage) {
                newCommandList.push({
                    id: -1,
                    commandString: "",
                    entryValue: "",
                    serverId: server.serverId,
                });
            }
            setCommandList(sortCommandList(newCommandList));
            setLoading(false);
        }
        setLoading(true);
        fetchData(server.serverId);
    }, [server.serverId, server.userCanManage])

    function handleCommandUpdate(index: number, newCommandString: string | undefined, newEntryValue: string | undefined)
    {
        let id = commandList[index].id;
        if ((index === commandList.length - 1) && needEmptyCommand()) {
            //TODO: clean this up
            addEmptyCommandToEnd();
        }
        if (!oldCommands.has(id)) {
            let original = {
                ...commandList[index]
            };
            setOldCommands(oldCommands =>
            {
                let newOldCommands = new Map(oldCommands);
                newOldCommands.set(id, original);
                return newOldCommands;
            });
        }
        setCommandList(commandList =>
        {
            let newList = [...commandList];
            if (newCommandString !== undefined) {
                newList[index].commandString = newCommandString;
            }
            else if (newEntryValue !== undefined) {
                newList[index].entryValue = newEntryValue;
            }

            return newList;
        });
    }

    function addEmptyCommandToEnd(): void
    {
        setCommandList(commandList =>
        {
            let newList = [...commandList];
            newList.push({
                id: nextTempId,
                commandString: "",
                entryValue: "",
                serverId: server.serverId,
            });
            setNextTempId(n => n - 1);
            return newList;
        })
    }

    function sortCommandList(list: ICommand[]): ICommand[]
    {
        let newList = [...list];
        newList.sort((a, b) =>
        {
            if (a.id < 0 && b.id >= 0) {
                return 1;
            }
            else if (b.id < 0 && a.id >= 0) {
                return -1;
            }
            if (a.commandString === b.commandString) {
                return a.id - b.id;
            }
            else {
                return a.commandString > b.commandString ? 1 : -1;
            }
        });
        return newList;
    }

    function needEmptyCommand(): boolean
    {
        if ((commandList[commandList.length - 1].commandString === "") && (commandList[commandList.length - 1].entryValue === "")) {
            return true;
        }
        return false;
    }

    async function acceptCommand(index: number, editSuccessCallback: Function)
    {
        var id: number;
        if (doesNotHaveRestrictedCommand(index) && isNotDuplicatedInList(index)) {
            if (commandList[index].id >= 0) {
                editSuccessCallback(Commands.saveCommandEdit(token, commandList[index]));
                id = commandList[index].id;
                setCommandList(commandList =>
                {
                    let newList = [...commandList];
                    sortCommandList(newList);
                    return newList;
                });

            }
            else {
                id = commandList[index].id;
                let newId = await Commands.postCommand(token, commandList[index]);
                if (newId >= 0) {
                    setCommandList(commandList =>
                    {
                        let newList = [...commandList];
                        newList[index].id = newId;
                        sortCommandList(newList);

                        //newList.push({
                        //    id: nextTempId,
                        //    commandString: "",
                        //    entryValue: "",
                        //    serverId: server.serverId,
                        //});
                        //setNextTempId(n => n - 1);
                        return newList;
                    })
                }
            }
            if (oldCommands.has(commandList[index].id)) {
                setOldCommands(oldCommands =>
                {
                    let newOldCommands = new Map(oldCommands);
                    newOldCommands.delete(id);
                    return newOldCommands;
                });
            }
        }
    }

    function cancelCommand(index: number)
    {
        let id = commandList[index].id;
        if (oldCommands.has(id)) {
            setCommandList(commandList =>
            {
                let newList = [...commandList];

                if (id < 0) {
                    newList.splice(index, 1);
                }
                else {
                    //not undefined because we checked above
                    let oldCommand = { ...oldCommands.get(id)! };
                    newList[index] = oldCommand;
                }
                return newList;
            });
            setOldCommands(oldCommands =>
            {
                let newOldCommands = new Map(oldCommands);
                newOldCommands.delete(id);
                return newOldCommands;
            });
        }
    }

    async function deleteCommand(index: number)
    {
        if (await Commands.deleteFromList(token, commandList[index].id)) {
            let id = commandList[index].id;
            if (oldCommands.has(id)) {
                setOldCommands(oldCommands =>
                {
                    let newOldCommands = new Map(oldCommands);
                    newOldCommands.delete(id);
                    return newOldCommands;
                });
                setCommandList(commandList =>
                {
                    //not undefined because we checked above
                    let newList = [...commandList];
                    newList.splice(index, 1);
                    return newList;
                });

            }
        }
        //TODO: delete then send message and confirm on response
    }

    function isNotDuplicatedInList(index: number)
    {
        //TODO: abstract these away
        let testCommand = commandList[index];
        for (let i = 0; i < commandList.length; i++) {
            if (i === index) {
                continue;
            }
            if ((testCommand.commandString === commandList[i].commandString) && (testCommand.entryValue === commandList[i].entryValue)) {
                //TODO: more verbose
                return false;
            }
        }
        return true;
    }
    function doesNotHaveRestrictedCommand(index: number)
    {
        return !restrictedCommands.find(cmdStr => cmdStr === commandList[index].commandString);
    }

    return (
        <LoadingMessage loading={loading}>
            <CommandList commands={commandList} updateCommand={handleCommandUpdate} acceptCommand={acceptCommand} cancelCommand={cancelCommand} userCanEdit={server.userCanManage} deleteCommand={deleteCommand} restrictedCommands={restrictedCommands} />
        </LoadingMessage>
    );
}

interface CommandListProps
{
    commands: ICommand[];
    updateCommand: Function;
    acceptCommand: Function;
    cancelCommand: Function;
    deleteCommand: Function;
    userCanEdit: boolean;
    restrictedCommands: string[];
}

export const CommandList: React.FunctionComponent<CommandListProps> = ({ commands, updateCommand, acceptCommand, cancelCommand, deleteCommand, userCanEdit, restrictedCommands }) =>
{
    return (
        <div>
            <ul className="_commandList">
                {
                    commands.map((cmd, index) => (
                        <CommandRow key={cmd.id}
                            index={index}
                            command={cmd}
                            handleUpdateCallback={updateCommand}
                            handleAcceptCallback={acceptCommand}
                            handleCancelCallback={cancelCommand}
                            handleDeleteCallback={deleteCommand}
                            userCanEdit={userCanEdit}
                            restrictedCommands={restrictedCommands}
                        />
                    ))
                }
            </ul>
        </div>
    );
}

export const TimeoutSecondsForm: React.FunctionComponent<{ timeoutSeconds: number, updateTimeoutSeconds: Function }> = ({ timeoutSeconds, updateTimeoutSeconds }) =>
{
    function handleNumberChange(event: any)
    {

    }

    return (
        <div>
            <form>
                <input type="number" onChange={handleNumberChange} />
            </form>
        </div>
    );
}



