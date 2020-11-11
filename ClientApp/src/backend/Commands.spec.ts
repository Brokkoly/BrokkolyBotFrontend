import { Commands } from "./Commands";
import { ErrorLevels } from "./Error";

it('should not have any errors for a valid response', () => {
    expect(Commands.checkResponseValidity("This is a valid response").getHighestErrorLevel()).toEqual(ErrorLevels.None);
})

it('should have a critical error because the response has a length of zero', () => {
    expect(Commands.checkResponseValidity('').getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a critical error because the response contains a mention', () => {
    expect(Commands.checkResponseValidity('<@225369871393882113> this is not allowed').getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a critical error because the response has a length >500', () => {
    expect(Commands.checkResponseValidity(
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '503')
        .getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have two errors because the response mentions somebody and has a length >500', () => {
    expect(Commands.checkResponseValidity(
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '503 <@225369871393882113> this is not allowed').errors.length).toEqual(2);
})

it('should have no errors',()=>{
    expect(Commands.checkCommandValidity('brokkoly', ['ylokkorb', 'brokkolybot']).getHighestErrorLevel()).toEqual(ErrorLevels.None);
})

it('should have a critical error because the command is too short',()=>{
    expect(Commands.checkCommandValidity('as', ['ylokkorb', 'brokkolybot']).getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a critical error because the command is too long',()=>{
    expect(Commands.checkCommandValidity('thiscommandiswaytoolong', ['ylokkorb', 'brokkolybot']).getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a critical error because the command is restricted',()=>{
    expect(Commands.checkCommandValidity('ylokkorb', ['ylokkorb', 'brokkolybot']).getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a critical error because the command has non-letters',()=>{
    expect(Commands.checkCommandValidity('br0kk0ly', ['ylokkorb', 'brokkolybot']).getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a two errors because the command has non-letters and is too long',()=>{
    expect(Commands.checkCommandValidity('thisc0mmandiswaytoolong', ['ylokkorb', 'brokkolybot']).errors.length).toEqual(2);
})






//test('Error should be empty', () =>
//{
//    expect(Commands.checkResponseValidity("This is a valid response").getHighestErrorLevel()).toBe(ErrorLevels.None);

//})