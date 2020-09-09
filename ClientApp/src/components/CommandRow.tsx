import * as React from 'react';

interface CommandRowProps
{
    id: number;
    command: string;
    value: string;
    serverId: string;
    deleteFromListCallback: Function;
    acceptEditCallback: Function;
    acceptNewCallback: Function;
    index: number;
}
interface CommandRowState
{
    command: string;
    value: string;
    hasBeenEdited: boolean;
}

export class CommandRow extends React.Component<CommandRowProps, CommandRowState>
{
    constructor(props: any)
    {
        super(props);
        this.state = { command: this.props.command, value: this.props.value, hasBeenEdited: false };
        this.handleChangeCommand = this.handleChangeCommand.bind(this);
        this.handleChangeValue = this.handleChangeValue.bind(this);
        this.handleAccept = this.handleAccept.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    private handleChangeCommand(event: any)
    {
        this.setState({
            command: event.target.value,
            value: this.state.value,
            hasBeenEdited: true,
        });
    }
    private handleChangeValue(event: any)
    {
        this.setState({
            command: this.state.command,
            value: event.target.value,
            hasBeenEdited: true,
        });
    }

    private async handleAccept()
    {
        //TODO: Validation
        //TODO: disable button and indicate that the action is in progress.
        await this.props.acceptEditCallback(this.props.index, this.state.command, this.state.value);
        this.setState({ hasBeenEdited: false });
    }

    private handleCancel()
    {
        this.setState({
            command: this.props.command,
            value: this.props.value,
            hasBeenEdited: false,
        })
    }

    public render()
    {
        return (
            <tr className="command-table-row"
                key={this.props.id}>
                <td />
                <td> !<input value={this.state.command} onChange={this.handleChangeCommand} />
                </td>
                <td> <textarea value={this.state.value} onChange={this.handleChangeValue} /> </td>
                <td>
                    <button onClick={() => this.handleAccept()} className={this.state.hasBeenEdited ? "" : "nodisp"} >Accept</button>
                </td>
                <td>
                    <button onClick={() => this.handleCancel()} className={this.state.hasBeenEdited ? "" : "nodisp"} >Cancel</button>
                </td>
                <td>
                    <button onClick={() => this.props.deleteFromListCallback(this.props.id)}> X </button>
                </td>
            </tr>
        );
    }
}