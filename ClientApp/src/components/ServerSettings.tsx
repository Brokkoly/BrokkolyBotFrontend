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
}

export const ServerSettings: React.FunctionComponent<ServerSettingsProps> = ({ server, token, restrictedCommands }) =>
{
    const [commandList, setCommandList] = useState<ICommand[]>([]);
    const [oldCommands, setOldCommands] = useState<Map<number, ICommand>>(new Map<number, ICommand>());
    const [timeoutSeconds, setTimeoutSeconds] = useState(5);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        async function fetchData(serverId: string)
        {
            setCommandList(await Commands.fetchCommands(serverId));
            setLoading(false);
        }
        fetchData(server.serverId);
    }, [server.serverId])

    function handleCommandUpdate(index: number, newCommandString: string | undefined, newEntryValue: string | undefined)
    {
        if (!oldCommands.has(commandList[index].id)) {
            setOldCommands(oldCommands =>
            {
                oldCommands.set(commandList[index].id, commandList[index]);
                return oldCommands;
            });
        }
        setCommandList(commandList =>
        {
            let newList = [...commandList]
            if (newCommandString) {
                newList[index].commandString = newCommandString;
            }
            else if (newEntryValue) {
                newList[index].entryValue = newEntryValue;
            }

            return newList;
        });
    }

    function acceptCommand(index: number, editSuccessCallback: Function)
    {
        if (doesNotHaveRestrictedCommand(index) && isNotDuplicatedInList(index)) {
            editSuccessCallback(Commands.saveCommandEdit(token, commandList[index]));
        }
    }

    function cancelCommand(index: number)
    {
        //TODO: cancel commmand
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
            <CommandList commands={commandList} updateCommand={handleCommandUpdate} acceptCommand={acceptCommand} cancelCommand={cancelCommand} userCanEdit={server.userCanManage} />
        </LoadingMessage>
    );
}

interface CommandList2Props
{
    commands: ICommand[];
    updateCommand: Function;
    acceptCommand: Function;
    cancelCommand: Function;
    userCanEdit: boolean;
}

export const CommandList: React.FunctionComponent<CommandList2Props> = ({ commands, updateCommand, acceptCommand, cancelCommand, userCanEdit }) =>
{
    return (
        <div>
            <ul className="commandList">
                {
                    commands.map((cmd, index) => (
                        <CommandRow key={cmd.id}
                            index={index}
                            command={cmd}
                            handleUpdateCallback={updateCommand}
                            handleAcceptCallback={acceptCommand}
                            handleCancelCallback={cancelCommand}
                            userCanEdit={userCanEdit}
                        />
                    ))
                }
            </ul>
        </div>
    );
}


class TimeoutSecondsForm extends React.Component
{

}

interface CommandListProps
{
    serverId: string;
}
interface CommandListState
{
    commandList: ICommand[];
    loading: boolean;
    restrictedCommands: string[];
}

class CommandList2 extends React.Component<CommandListProps, CommandListState>
{
    constructor(props: any)
    {
        super(props);
        this.state = { commandList: [], loading: true, restrictedCommands: [] };
        this.deleteFromList = this.deleteFromList.bind(this);
        this.deleteFromCommandList = this.deleteFromCommandList.bind(this);
        this.saveEdit = this.saveEdit.bind(this);
        this.putEdit = this.putEdit.bind(this);
        this.postCommand = this.postCommand.bind(this);
    }
    public async componentWillMount()
    {
        if (this.props.serverId) {
            await Commands.fetchCommands(this.props.serverId);
        }
    }

    public async componentDidUpdate(prevProps: CommandListProps)
    {
        if (this.props.serverId !== prevProps.serverId) {
            Commands.fetchCommands(this.props.serverId);
        }
    }

    public async saveEdit(index: number, command: string, value: string)
    {
        //TODO: check here for handling of post/put
        var listCopy = [...this.state.commandList];
        listCopy[index].commandString = command;
        listCopy[index].entryValue = value;
        if (this.state.commandList[index].id < 0) {
            listCopy[index].id = await this.postCommand(this.state.commandList[index]);
            listCopy.push({
                id: -1,
                serverId: this.props.serverId,
                commandString: "DefaultCommand",
                entryValue: "Enter Text Here!"
            });
        }
        else {
            this.putEdit(this.state.commandList[index]);
        }
        this.setState({ commandList: listCopy, loading: false });

    }

    public async putEdit(command: ICommand)
    {
        let fetchUrl = '/api/Commands/PutCommand/' + command.id;
        fetch(
            fetchUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'PUT',
                body: JSON.stringify(command)
            }
        ).then(response => response.json())
            .then(data =>
            {
                console.log('Success:', data);
            })
            .catch((error) =>
            {
                console.error('Error:', error);
            });

    }

    public async postCommand(command: ICommand): Promise<number>
    {
        const commandJson = JSON.parse(JSON.stringify(command));
        delete commandJson['id'];

        let fetchUrl = '/api/Commands/PostCommand';
        const response = fetch(
            fetchUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify(commandJson)
            }
        );
        let commandText = await (await response).text();
        let commandResponse = await JSON.parse(commandText);
        if (commandResponse?.id) {
            return commandResponse.id;
        }
        else {
            return -1;
        }
    }

    public async deleteFromList(id: string)
    {
        let fetchUrl = '/api/Commands/DeleteCommand?id=' + id;
        const response = await fetch(fetchUrl
            , {
                method: 'DELETE',
            }
        ).then(
            response => response.json()

        );
        if (response?.id) {
            this.deleteFromCommandList(response.id);
        }
        else {
            this.deleteFailed(id);
        }
    }

    private deleteFailed(id: string)
    {
        console.log('delete failed for id=' + id);
    }

    private deleteSucceeded(id: string)
    {

    }

    private deleteFromCommandList(id: number)
    {
        var listCopy = [...this.state.commandList]
        var index = -1;
        for (let i = 0; i < listCopy.length; i++) {
            if (listCopy[i].id === id) {
                index = i;
                break;
            }
        }
        if (index !== -1) {
            listCopy.splice(index, 1);
            this.setState({ commandList: listCopy, loading: this.state.loading })
        }
    }

    public render()
    {
        let contents = this.state.loading ? (
            <p>
                <em>
                    Loading...
            </em>
            </p>
        ) : (
                null
            );

        return <div>{contents} </div>;
    }
}