import React, { CSSProperties, useEffect, useState } from "react";
import { Commands, ICommand } from "../backend/Commands";
import { IError } from "../backend/Error";
import { IServer, Servers, IRole } from "../backend/Servers";
import { Helpers } from "../helpers";
import { CommandRow } from "./CommandRow";
import { LoadingMessage } from "./ServerList";

interface ServerSettingsProps
{
    token: string;
    serverIndex: number;
    server: IServer;
    restrictedCommands: string[];
    handleServerChange: Function;
    handleServerAccept: Function;
    handleServerCancel: Function;
}

export const ServerSettings: React.FunctionComponent<ServerSettingsProps> = ({
    server,
    token,
    restrictedCommands,
    handleServerChange,
    handleServerAccept,
    handleServerCancel,
    serverIndex
}) =>
{
    const [commandList, setCommandList] = useState<ICommand[]>([]);
    const [oldCommands, setOldCommands] = useState<Map<number, ICommand>>(
        new Map<number, ICommand>()
    );
    const [serverRoles, setServerRoles] = useState<IRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextTempId, setNextTempId] = useState(-2);

    useEffect(
        () =>
        {
            async function fetchData(serverId: string)
            {
                let newCommandList = await Commands.fetchCommands(serverId);
                if (server.userCanManage) {
                    newCommandList.push({
                        id: -1,
                        commandString: "",
                        entryValue: "",
                        serverId: server.serverId
                    });
                }
                setCommandList(sortCommandList(newCommandList));
                setServerRoles(await Servers.getGuildRoles(token, serverId));
                setLoading(false);
            }
            setLoading(true);
            fetchData(server.serverId);
        },
        [server.serverId, server.userCanManage, token]
    );

    function handleCommandUpdate(
        index: number,
        newCommandString: string | undefined,
        newEntryValue: string | undefined
    )
    {
        let id = commandList[index].id;
        if (index === commandList.length - 1 && needEmptyCommand()) {
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
            } else if (newEntryValue !== undefined) {
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
                serverId: server.serverId
            });
            setNextTempId(n => n - 1);
            return newList;
        });
    }

    function sortCommandList(list: ICommand[]): ICommand[]
    {
        let newList = [...list];
        newList.sort((a, b) =>
        {
            if (a.id < 0 && b.id >= 0) {
                return 1;
            } else if (b.id < 0 && a.id >= 0) {
                return -1;
            }
            if (a.commandString === b.commandString) {
                return a.id - b.id;
            } else {
                return a.commandString > b.commandString ? 1 : -1;
            }
        });
        return newList;
    }

    function needEmptyCommand(): boolean
    {
        if (
            commandList[commandList.length - 1].commandString === "" &&
            commandList[commandList.length - 1].entryValue === ""
        ) {
            return true;
        }
        return false;
    }

    async function acceptCommand(index: number, editSuccessCallback: Function)
    {
        var id: number;
        if (doesNotHaveRestrictedCommand(index) && isNotDuplicatedInList(index)) {
            if (commandList[index].id >= 0) {
                editSuccessCallback(
                    Commands.saveCommandEdit(token, commandList[index])
                );
                id = commandList[index].id;
                setCommandList(commandList =>
                {
                    let newList = [...commandList];
                    sortCommandList(newList);
                    return newList;
                });
            } else {
                id = commandList[index].id;
                let newId = await Commands.postCommand(token, commandList[index]);
                if (newId >= 0) {
                    setCommandList(commandList =>
                    {
                        let newList = [...commandList];
                        newList[index].id = newId;
                        sortCommandList(newList);

                        return newList;
                    });
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
                } else {
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
            if (
                testCommand.commandString === commandList[i].commandString &&
                testCommand.entryValue === commandList[i].entryValue
            ) {
                //TODO: more verbose
                return false;
            }
        }
        return true;
    }

    function doesNotHaveRestrictedCommand(index: number)
    {
        //TODO: just have this validate the command
        return !restrictedCommands.find(
            cmdStr => cmdStr === commandList[index].commandString
        );
    }

    return (
        <LoadingMessage loading={loading}>
            <OtherSettingsForm
                server={server}
                serverIndex={serverIndex}
                updateServerSettings={handleServerChange}
                handleCancelCallback={handleServerCancel}
                handleAcceptCallback={handleServerAccept}
                serverRoles={serverRoles}
            />
            <div className="betweenDiv20" />
            <CommandList
                commands={commandList}
                updateCommand={handleCommandUpdate}
                acceptCommand={acceptCommand}
                cancelCommand={cancelCommand}
                userCanEdit={server.userCanManage}
                deleteCommand={deleteCommand}
                restrictedCommands={restrictedCommands}
            />
        </LoadingMessage>
    );
};

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

export const CommandList: React.FunctionComponent<CommandListProps> = ({
    commands,
    updateCommand,
    acceptCommand,
    cancelCommand,
    deleteCommand,
    userCanEdit,
    restrictedCommands
}) =>
{
    return (
        <div>
            <ul className="_commandList">
                {commands.map((cmd, index) => (
                    <CommandRow
                        key={cmd.id}
                        index={index}
                        command={cmd}
                        handleUpdateCallback={updateCommand}
                        handleAcceptCallback={acceptCommand}
                        handleCancelCallback={cancelCommand}
                        handleDeleteCallback={deleteCommand}
                        userCanEdit={userCanEdit}
                        restrictedCommands={restrictedCommands}
                    />
                ))}
            </ul>
        </div>
    );
};

export const OtherSettingsForm: React.FunctionComponent<{
    server: IServer;
    serverIndex: number;
    updateServerSettings: Function;
    handleAcceptCallback: Function;
    handleCancelCallback: Function;
    serverRoles: IRole[];
}> = ({
    server,
    updateServerSettings,
    handleAcceptCallback,
    handleCancelCallback,
    serverRoles,
    serverIndex,
}) =>
    {
        const [hasBeenUpdated, setHasBeenUpdated] = useState(false);
        const [secondsError, setSecondsError] = useState<undefined | IError>(
            undefined
        );
        const [disableAccept, setDisableAccept] = useState(false);

        function handleNumberChange(event: any)
        {
            let actualNumber = event.target.value;
            if (isNaN(actualNumber)) {
                actualNumber = Number(actualNumber.replace(/\D/g, ''));
            }
            updateServerSettings(serverIndex, actualNumber);
            //setSecondsError(validateNumber(event.target.value));
            setHasBeenUpdated(true);

        }
        function handleRoleChange(event: any)
        {
            updateServerSettings(serverIndex, undefined, event.target.value);
            setHasBeenUpdated(true);
        }

        useEffect(
            () =>
            {
                if (!hasBeenUpdated) {
                    setSecondsError(undefined);
                    return;
                }
                setSecondsError(Servers.checkTimeoutValidity(server.timeoutSeconds));
            },
            [server.timeoutSeconds, hasBeenUpdated]
        );

        useEffect(
            () =>
            {
                if (secondsError) {
                    setDisableAccept(true);
                } else {
                    setDisableAccept(false);
                }
            },
            [secondsError]
        );

        useEffect(() => { }, [serverRoles]);

        function handleCancel()
        {
            handleCancelCallback(serverIndex);
            setHasBeenUpdated(false);
        }
        function handleAccept(event: any)
        {
            event.preventDefault();
            handleAcceptCallback(serverIndex);
            setHasBeenUpdated(false);
        }

        function constructStyleFromNumber(color: number): CSSProperties | undefined
        {
            return { color: color.toString(16) };
        }

        function renderSelectForm()
        {
            return (
                <>
                    <label>
                        Select the role that can manage the bot:
          <select
                            className="_roleSelect"
                            value={server.botManagerRoleId}
                            onChange={handleRoleChange}
                        >
                            <option className="_roleOption" key={""} value={""}>
                                None
            </option>
                            {serverRoles.map((rle: IRole) => (
                                <option
                                    className="_roleOption"
                                    style={constructStyleFromNumber(rle.color)}
                                    key={rle.id}
                                    value={rle.id}
                                >
                                    {rle.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </>
            );
        }

        return (
            <div>
                <form onSubmit={handleAccept}>
                    <div className="flexColumn" >
                        <div className="flexRow">
                            <label className="_inputText">
                                Timeout Seconds:
                            <input type="text" value={server.timeoutSeconds} title={String(secondsError?.message.map(s => s + "\n"))} className={"_formInput _commandInput " + Helpers.stringIf("_formError", Boolean(secondsError))} onChange={handleNumberChange} disabled={!server.userCanManage} />
                            </label>
                        </div>
                        {/*TODO: info hover icon that says what exactly these do*/}
                        {/*{renderSelectForm}*/}
                        <div className="flexRow">
                            <label className="_inputText">
                                {"Select the role that can manage the bot: "}
                                <select
                                    className="_formInput _roleSelect"
                                    value={server.botManagerRoleId || ""}
                                    onChange={handleRoleChange}
                                    disabled={!server.userCanManage}
                                >
                                    <option className="_roleOption" key={"0"} value={""}>
                                        None
            </option>
                                    {serverRoles.map((rle: IRole) => (
                                        <option
                                            className="_roleOption"
                                            style={constructStyleFromNumber(rle.color)}
                                            key={rle.id}
                                            value={rle.id}
                                        >
                                            {rle.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="flexRow">
                            <input
                                type="submit"
                                value="Accept"
                                className={
                                    "_formButton _acceptButton " + Helpers.nodispIf(!hasBeenUpdated)
                                }
                                disabled={disableAccept}
                            />
                            <button
                                onClick={handleCancel}
                                className={
                                    "_formButton _cancelButton " + Helpers.nodispIf(!hasBeenUpdated)
                                }
                            >
                                Cancel
            </button>
                        </div>
                    </div>
                </form>
            </div >
        );
    };
