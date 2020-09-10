import * as React from 'react';
import { CommandRow } from './CommandRow';

interface Server
{
    id: string;
    iconUrl?: string;
    name?: string;
    timeoutSeconds?: number;
    timeoutRoleId?: number;
}

interface Command
{
    id: number;
    serverId: string;
    commandString: string;
    entryValue: string;
}



interface ServerSettingsProps
{
    selectedId: string;
    token: string;
}

interface ServerSettingsState
{

}



export class ServerSettings extends React.Component<ServerSettingsProps, ServerSettingsState>{

    public async componentWillMount()
    {
        await fetch("https://discord.com/api/users/@me/guilds/",
            {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer [${this.props.token}]`,
                }

            }
        ).then(
            response => console.log(response.text())
        );
    }
    public render()
    {
        return (<div>
            <CommandList serverId={this.props.selectedId} />
        </div>);
    }
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
    commandList: Command[];
    loading: boolean;
    restrictedCommands: string[];
}




class CommandList extends React.Component<CommandListProps, CommandListState>
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
            await this.fetchCommands(this.props.serverId);
        }
    }

    public async componentDidUpdate(prevProps: CommandListProps)
    {
        if (this.props.serverId !== prevProps.serverId) {
            this.fetchCommands(this.props.serverId);
        }
    }

    public async saveEdit(index: number, command: string, value: string)
    {
        var listCopy = [...this.state.commandList];
        //TODO: Validation
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

    public async putEdit(command: Command)
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

    public async postCommand(command: Command): Promise<number>
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

    private async fetchCommands(serverId: string)
    {
        if (!this.state.loading) {
            this.setState({ commandList: [], loading: true });
        }
        let fetchUrl = '/api/Commands/GetCommandsForServer?serverId=' + serverId;
        const result = await fetch(fetchUrl);
        const text = await result.text();
        var commands = await JSON.parse(text.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));
        commands.push({ id: -1, serverId: this.props.serverId, commandString: "", entryValue: "" });
        this.setState({ commandList: commands, loading: false });
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
                this.renderCommandList(this.state.commandList)
            );

        return <div>{contents} </div>;
    }

    public renderCommandList(commandList: Command[])
    {
        return (
            <div>
                <ul className="commandList">
                    {
                        commandList.map((cmd, index) => (
                            <CommandRow key={cmd.id}
                                index={index}
                                id={cmd.id}
                                command={cmd.commandString}
                                serverId={cmd.serverId}
                                value={cmd.entryValue}
                                deleteFromListCallback={this.deleteFromList}
                                acceptEditCallback={this.saveEdit}
                                acceptNewCallback={this.postCommand}
                            />
                        ))
                    }
                </ul>
            </div>
        );
    }
}


