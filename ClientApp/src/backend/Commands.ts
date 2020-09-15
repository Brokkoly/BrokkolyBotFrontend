import { Servers } from "./Servers";

export class Commands
{
    public static async getRestrictedCommands(): Promise<string[]>
    {
        return Servers.getRestrictedCommands().then(data =>
            data.map((restrictedCommand: IRestrictedCommand) => restrictedCommand.command));
    }
    public static async fetchCommands(serverId: string): Promise<ICommand[]>
    {
        let fetchUrl = '/api/Commands/GetCommandsForServer?serverId=' + serverId;
        const result = await fetch(fetchUrl);
        const text = await result.text();
        var commands = await JSON.parse(text.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));
        return commands;
    }
    public static async saveCommandEdit(token: string, command: ICommand)
    {
        let fetchUrl = '/api/Commands/PutCommand/'// + command.id;
        fetch(
            fetchUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'PUT',
                body: JSON.stringify({
                    command: {
                        Id: command.id,
                        ServerId: command.serverId,
                        CommandString: command.commandString,
                        EntryValue: command.entryValue,
                    },
                    token: token
                })
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
        //TODO: Figure out how to do response checking and confirm when stuff works properly
        return true;
    }

    public static async postCommand(token: string, command: ICommand): Promise<number>
    {
        let fetchUrl = '/api/Commands/PostCommand';
        const response = await fetch(
            fetchUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify({
                    command: {
                        ServerId: command.serverId,
                        CommandString: command.commandString,
                        EntryValue: command.entryValue,
                    },
                    token: token
                })
            }
        );
        let commandResponse = await response.json();
        if (commandResponse?.id) {
            return commandResponse.id;
        }
        else {
            return -1;
        }
    }

    public static async deleteFromList(token: string, id: number)
    {
        let fetchUrl = '/api/Commands/DeleteCommand';
        const response = await fetch(fetchUrl
            , {
                method: 'DELETE',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    id: id
                })
            }
        ).then(
            response => response.json()

        );
        if (response?.id) {
            return true;
        }
        else {
            return false;
        }
    }
}
export interface ICommand
{
    id: number;
    serverId: string;
    commandString: string;
    entryValue: string;
}
export interface IRestrictedCommand
{
    id: number;
    command: string;
}