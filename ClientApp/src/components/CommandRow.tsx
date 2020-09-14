import * as React from 'react';
import { useState } from 'react';
import { ICommand } from '../backend/Commands';
import { Helpers } from '../helpers';

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

    function handleChangeCommand(event: any)
    {
        let value = event.target.value.toL;
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
        </div>
    );
}