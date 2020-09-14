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