﻿import * as React from 'react';
import { useState } from 'react';
import { Button, Form, FormControl, InputGroup } from 'react-bootstrap';
import { ICommand } from '../backend/Commands';
import { Helpers } from '../helpers';

//interface CommandRowProps
//{
//    id: number;
//    command: string;
//    value: string;
//    serverId: string;
//    deleteFromListCallback: Function;
//    acceptEditCallback: Function;
//    acceptNewCallback: Function;
//    index: number;
//}
//interface CommandRowState
//{
//    command: string;
//    value: string;
//    hasBeenEdited: boolean;
//}

interface CommandRowProps
{
    command: ICommand;
    index: number;
    handleUpdateCallback: Function;
    handleAcceptCallback: Function;
    handleCancelCallback: Function;
    userCanEdit: boolean;
}
export const CommandRow: React.FunctionComponent<CommandRowProps> = ({ command, index, handleUpdateCallback, handleAcceptCallback, userCanEdit }) =>
{
    const [hasBeenUpdated, setHasBeenUpdated] = useState(false);
    const [oldCommand, setOldCommand] = useState<ICommand>(command)
    function handleAcceptCommand()
    {
        //handleUpdateCallback(index, changedCommand)
    }

    function handleChangeCommand(event: any)
    {
        let value = event.target.value;
        handleUpdateCallback(index, value, undefined);
        setHasBeenUpdated(true);
    }


    function handleChangeValue(event: any)
    {
        let value = event.target.value;
        handleUpdateCallback(index, undefined, value);
        setHasBeenUpdated(true);
    }

    function handleSubmit(event: React.FormEvent)
    {
        event.preventDefault();
        handleAcceptCallback(index, handleSubmitCallback);
        //todo: validation here
    }
    function handleSubmitCallback(success: boolean)
    {
        if (success) {
            setHasBeenUpdated(false);
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input type="text" value={command.commandString} onChange={handleChangeCommand} disabled={!userCanEdit} />
                <textarea value={command.entryValue} onChange={handleChangeValue} disabled={!userCanEdit} />
                <input type="submit" value="Accept" className={Helpers.nodispIf(!hasBeenUpdated)} disabled={!userCanEdit} />
            </form>
            {/*<Form inline>
                <Form.Label htmlFor="inlineFormInputGroupCommand" srOnly>
                    Command
                    </Form.Label>
                <InputGroup className="mb-2 mr-sm-2">
                    <InputGroup.Prepend>
                        <InputGroup.Text>!</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl id="inlineFormInputGroupCommand" placeholder="Command" value={changedCommand.commandString} onChange={handleChangeCommand} />
                </InputGroup>
                <Form.Label htmlFor="inlineFormValue" srOnly>
                    Value
                    </Form.Label>
                <Form.Control
                    className="mb-2 mr-sm-2"
                    id="inlineFormValue"
                    placeholder="Add Text Here"
                    value={changedCommand.entryValue}
                    onChange={handleChangeValue}
                />
                <Button variant="submit" onClick={() => handleAcceptCommand()} className={hasBeenUpdated ? "" : "nodisp"} >{command.id === -1 ? "Add New" : "Accept"}</Button>*/}
            {/*<Button variant="light" onClick={() => this.handleCancel()} className={this.state.hasBeenEdited ? "" : "nodisp"} >Cancel</Button>
                <Button variant="danger" onClick={() => this.props.deleteFromListCallback(this.props.id)} className={this.props.id === -1 ? "nodisp" : ""}> Delete </Button>
            </Form>*/}
        </div >
    );
}


//export class CommandRow extends React.Component<CommandRowProps, CommandRowState>
//{
//    //TODO: Use hooks instead of state stuff.
//    constructor(props: any)
//    {
//        super(props);
//        this.state = { command: this.props.command, value: this.props.value, hasBeenEdited: false };
//        this.handleChangeCommand = this.handleChangeCommand.bind(this);
//        this.handleChangeValue = this.handleChangeValue.bind(this);
//        this.handleAccept = this.handleAccept.bind(this);
//        this.handleCancel = this.handleCancel.bind(this);
//    }

//    private handleChangeCommand(event: any)
//    {
//        this.setState({
//            command: event.target.value,
//            value: this.state.value,
//            hasBeenEdited: true,
//        });
//    }
//    private handleChangeValue(event: any)
//    {
//        this.setState({
//            command: this.state.command,
//            value: event.target.value,
//            hasBeenEdited: true,
//        });
//    }

//    private async handleAccept()
//    {
//        //TODO: Validation
//        //TODO: disable button and indicate that the action is in progress.
//        await this.props.acceptEditCallback(this.props.index, this.state.command, this.state.value);
//        this.setState({ hasBeenEdited: false });
//    }

//    private handleCancel()
//    {
//        this.setState({
//            command: this.props.command,
//            value: this.props.value,
//            hasBeenEdited: false,
//        })
//    }

//    public render()
//    {
//        return (this.renderRow());


//    }
//    //           <tr className="command-table-row"
//    //    key={this.props.id}>
//    //    <td />
//    //    <td> !<input value={this.state.command} onChange={this.handleChangeCommand} />
//    //    </td>
//    //    <td> <textarea value={this.state.value} onChange={this.handleChangeValue} /> </td>
//    //    <td>
//    //        
//    //    </td>
//    //    <td>
//    //        
//    //    </td>
//    //    <td>
//    //        
//    //    </td>
//    //</tr>


//    public renderRow()
//    {
//        return (
//            <div>
//                <Form inline>
//                    <Form.Label htmlFor="inlineFormInputGroupCommand" srOnly>
//                        Command
//                    </Form.Label>
//                    <InputGroup className="mb-2 mr-sm-2">
//                        <InputGroup.Prepend>
//                            <InputGroup.Text>!</InputGroup.Text>
//                        </InputGroup.Prepend>
//                        <FormControl id="inlineFormInputGroupCommand" placeholder="Command" value={this.state.command} onChange={this.handleChangeCommand}/>
//                    </InputGroup>
//                    <Form.Label htmlFor="inlineFormValue" srOnly>
//                        Value
//                    </Form.Label>
//                    <Form.Control
//                        className="mb-2 mr-sm-2"
//                        id="inlineFormValue"
//                        placeholder="Add Text Here"
//                        value={this.state.value}
//                        onChange={this.handleChangeValue}
//                    />
//                    <Button variant="submit" onClick={() => this.handleAccept()} className={this.state.hasBeenEdited ? "" : "nodisp"} >{this.props.id === -1 ? "Add New" : "Accept"}</Button>
//                    <Button variant="light" onClick={() => this.handleCancel()} className={this.state.hasBeenEdited ? "" : "nodisp"} >Cancel</Button>
//                    <Button variant="danger" onClick={() => this.props.deleteFromListCallback(this.props.id)} className={this.props.id === -1 ? "nodisp" : ""}> Delete </Button>
//                </Form>
//            </div>
//        );
//    }
//}