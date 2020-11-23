import { Response, ResponseGroup, ResponseGroupList } from "./ResponseGroup";

const reallyLongCommand = '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789';

const responseGroupList = new ResponseGroupList(
    {
        responseGroups: [
            new ResponseGroup(0, "notmodonly",
                [
                    new Response({ id: 294, response: "No need to be a mod.", modOnly: 0 })
                ]),
            new ResponseGroup(1, "bigbrain",
                [
                    new Response({ id: 271, response: "edited this", modOnly: 0 })
                ]),
            new ResponseGroup(2, "todo",
                [
                    new Response({ id: 296, response: "Figure out the mods only hat", modOnly: 0 }),
                    new Response({ id: 297, response: "Stuff doesn't grey out on accept anymore.", modOnly: 0 })
                ]),
            new ResponseGroup(3, "testtwo",
                [
                    new Response({ id: 272, response: "asdf", modOnly: 0 })
                ]),
            new ResponseGroup(4, "test",
                [
                    new Response({ id: 247, response: "New Value New Value", modOnly: 0 }),
                    new Response({ id: 279, response: "blah", modOnly: 0 }),
                    new Response({ id: 274, response: "Asdf", modOnly: 0 }),
                    new Response({ id: 266, response: "This is a test command", modOnly: 0 }),
                    new Response({ id: 278, response: "asdf", modOnly: 0 })
                ]),
            new ResponseGroup(5, "lorem",
                [
                    new Response({
                        id: 267,
                        response: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                        modOnly: 0
                    })
                ]),
            new ResponseGroup(6, "purpose",
                [
                    new Response({ id: 280, response: "What is my purpose", modOnly: 0 })
                ]),
            new ResponseGroup(7, "yourepeatshitposts",
                [
                    new Response({ id: 281, response: "Oh God", modOnly: 0 })
                ]),
            new ResponseGroup(8, "modsonly",
                [
                    new Response({ id: 293, response: "haha i'm a mod", modOnly: 1 })
                ]),
            new ResponseGroup(9, "testneedsnewresponse", []),
            new ResponseGroup(10, "testneedsnewresponsetwo",
                [
                    new Response({ id: 2074, response: "Asdf", modOnly: 0 }),
                    new Response({ id: 2066, response: "This is a test command", modOnly: 0 }),
                    new Response({ id: -2, response: "", modOnly: 0 }),
                ]),
            new ResponseGroup(11, "testneedsnewresponsetwo",
                [
                    new Response({ id: 20741, response: "Asdf", modOnly: 0 }),
                    new Response({ id: -3, response: "", modOnly: 0 }),
                    new Response({ id: 20661, response: "This is a test command", modOnly: 0 }),
                ]),
            new ResponseGroup(12, "testneedsnewresponsethree",
                [
                    new Response({ id: 20742, response: "Asdf", modOnly: 0 }),
                    new Response({ id: 20662, response: "This is a test command", modOnly: 0 }),
                    new Response({ id: -4, response: "", modOnly: 0 }),
                ])

        ]
    }
);

describe('Find Response Index Tests', () =>
{

    const testCasesResponses = [
        {
            groupId: 1,
            id: 271,
            expectedIndex: 0
        },
        {
            groupId: 34,
            id: 271,
            expectedIndex: -1
        },
        {
            groupId: 5,
            id: 267,
            expectedIndex: 0
        },
        {
            groupId: 4,
            id: 279,
            expectedIndex: 1
        },
        {
            groupId: 4,
            id: 1,
            expectedIndex: -1
        },
    ];

    testCasesResponses.forEach(test =>
    {
        it(`Should find the index of the response with id ${test.id} in the group with id ${test.groupId}. Expected ${test.expectedIndex}`, () =>
        {
            let rgi: number = responseGroupList.findResponseGroupIndex(test.groupId);
            const responseIndexInGroup = responseGroupList.responseGroups[rgi]?.findResponse({ id: test.id }).index ?? -1;
            expect(responseIndexInGroup).toEqual(test.expectedIndex);

        });
    });
})

describe('Find Response Group Index Tests', () =>
{
    const testCasesList = [
        {
            id: 1,
            expectedIndex: 1
        },
        {
            id: 34,
            expectedIndex: -1
        },
        {
            id: 4,
            expectedIndex: 4
        },
        {
            id: 5,
            expectedIndex: 5
        },
        {
            id: 0,
            expectedIndex: 0
        },
    ];

    testCasesList.forEach(test =>
    {
        it(`Should find the index of the group whose original command is ${test.id}`, () =>
        {
            const groupIndex = responseGroupList.findResponseGroupIndex(test.id);
            expect(groupIndex).toEqual(test.expectedIndex);
        })
    })
})