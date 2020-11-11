import { Commands, ResponseGroup } from "./Commands";
import { ErrorLevels } from "./Error";


const responseGroups = [
    new ResponseGroup("notmodonly",
        [
            {
                "id": 294,
                "response": "No need to be a mod.",
                "modOnly": 0
            }
        ]),
    new ResponseGroup("bigbrain",
        [
            {
                "id": 271,
                "response": "edited this",
                "modOnly": 0
            }
        ]),
    new ResponseGroup("todo",
        [
            {
                "id": 296,
                "response": "Figure out the mods only hat",
                "modOnly": 0
            },
            {
                "id": 297,
                "response": "Stuff doesn't grey out on accept anymore.",
                "modOnly": 0
            }
        ]),
    new ResponseGroup("testtwo",
        [
            {
                "id": 272,
                "response": "asdf",
                "modOnly": 0
            }
        ]),
    new ResponseGroup("test",
        [
            {
                "id": 247,
                "response": "New Value New Value",
                "modOnly": 0
            },
            {
                "id": 279,
                "response": "blah",
                "modOnly": 0
            },
            {
                "id": 274,
                "response": "Asdf",
                "modOnly": 0
            },
            {
                "id": 266,
                "response": "This is a test command",
                "modOnly": 0
            },
            {
                "id": 278,
                "response": "asdf",
                "modOnly": 0
            }
        ]),
    new ResponseGroup("lorem",
        [
            {
                "id": 267,
                "response": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                "modOnly": 0
            }
        ]),
    new ResponseGroup("purpose",
        [
            {
                "id": 280,
                "response": "What is my purpose",
                "modOnly": 0
            }
        ]),
    new ResponseGroup("yourepeatshitposts",
        [
            {
                "id": 281,
                "response": "Oh God",
                "modOnly": 0
            }
        ]),
    new ResponseGroup("modsonly",
        [
            {
                "id": 293,
                "response": "haha i'm a mod",
                "modOnly": 1
            }
        ])
];
responseGroups[0].command = "notmodonlyedited";


it('should not have any errors for a valid response', () =>
{
    expect(Commands.checkResponseValidity("This is a valid response").getHighestErrorLevel()).toEqual(ErrorLevels.None);
})

it('should have a critical error because the response has a length of zero', () =>
{
    expect(Commands.checkResponseValidity('').getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a critical error because the response contains a mention', () =>
{
    expect(Commands.checkResponseValidity('<@225369871393882113> this is not allowed').getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a critical error because the response has a length >500', () =>
{
    expect(Commands.checkResponseValidity(
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '503')
        .getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have two errors because the response mentions somebody and has a length >500', () =>
{
    expect(Commands.checkResponseValidity(
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
        '503 <@225369871393882113> this is not allowed').errors.length).toEqual(2);
})

it('should have no errors', () =>
{
    expect(Commands.checkCommandValidity('brokkoly', ['ylokkorb', 'brokkolybot']).getHighestErrorLevel()).toEqual(ErrorLevels.None);
})

it('should have a critical error because the command is too short', () =>
{
    expect(Commands.checkCommandValidity('as', ['ylokkorb', 'brokkolybot']).getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a critical error because the command is too long', () =>
{
    expect(Commands.checkCommandValidity('thiscommandiswaytoolong', ['ylokkorb', 'brokkolybot']).getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a critical error because the command is restricted', () =>
{
    expect(Commands.checkCommandValidity('ylokkorb', ['ylokkorb', 'brokkolybot']).getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a critical error because the command has non-letters', () =>
{
    expect(Commands.checkCommandValidity('br0kk0ly', ['ylokkorb', 'brokkolybot']).getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
})

it('should have a two errors because the command has non-letters and is too long', () =>
{
    expect(Commands.checkCommandValidity('thisc0mmandiswaytoolong', ['ylokkorb', 'brokkolybot']).errors.length).toEqual(2);
})

describe('Find Response Group Index Tests', () =>
{

    const testCasesCommand = [
        {
            command: "bigbrain",
            expectedIndex: 1
        },
        {
            command: "doesntexist",
            expectedIndex: -1
        },
        {
            command: "test",
            expectedIndex: 4
        },
        {
            command: "lorem",
            expectedIndex: 5
        },
        {
            command: "notmodonly",
            expectedIndex: 0
        },
        {
            command: "notmodonlyedited",
            expectedIndex: -1
        },
    ];

    testCasesCommand.forEach(test =>
    {
        it(`Should find the index of the group whose original command is ${test.command}`, () =>
        {
            const groupIndex = Commands.findResponseGroupIndex(test.command, responseGroups);
            expect(groupIndex).toEqual(test.expectedIndex);
        })
    })
})


describe('Find Response Index Tests', () =>
{

    const testCasesResponses = [
        {
            command: "bigbrain",
            responseGroupIndex: 1,
            id: 271,
            expectedIndex: 0
        },
        {
            command: undefined,
            responseGroupIndex: 1,
            id: 271,
            expectedIndex: 0
        },
        {
            command: "bigbrain",
            responseGroupIndex: undefined,
            id: 271,
            expectedIndex: 0
        },
        {
            command: "doesntexist",
            responseGroupIndex: undefined,
            id: 271,
            expectedIndex: -1
        },
        {
            command: undefined,
            responseGroupIndex: undefined,
            id: 271,
            expectedIndex: -1
        },
        {
            command: "lorem",
            responseGroupIndex: undefined,
            id: 267,
            expectedIndex: 0
        },
        {
            command: "test",
            responseGroupIndex: undefined,
            id: 279,
            expectedIndex: 1
        },
        {
            command: undefined,
            responseGroupIndex: 4,
            id: 279,
            expectedIndex: 1
        },
        {
            command: undefined,
            responseGroupIndex: 4,
            id: 1,
            expectedIndex: -1
        },
    ];

    testCasesResponses.forEach(test =>
    {
        it(`Should find the index of the response with id ${test.id} in the group with index ${test.responseGroupIndex} or command ${test.responseGroupIndex}. Expected ${test.expectedIndex}`, () =>
        {
            const responseIndexInGroup = Commands.findResponseIndex({ id: test.id, command: test.command, responseGroupIndex: test.responseGroupIndex }, responseGroups);
            expect(responseIndexInGroup).toEqual(test.expectedIndex);

        });
    });
})
