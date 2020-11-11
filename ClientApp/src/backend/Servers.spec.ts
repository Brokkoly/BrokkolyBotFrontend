import { ErrorLevels } from "./Error";
import { Servers } from "./Servers";

describe('Timeout Tests', () => {
	var testCases = [
		{
			timeout: 0,
			expectedErrorLevel: ErrorLevels.None,
			expectedErrorLength: 0
		},
		{
			timeout: 5,
			expectedErrorLevel: ErrorLevels.None,
			expectedErrorLength: 0
		},
		{
			timeout: -1,
			expectedErrorLevel: ErrorLevels.Critical,
			expectedErrorLength: 1
		},
		{
			timeout: NaN,
			expectedErrorLevel: ErrorLevels.Critical,
			expectedErrorLength: 1
		}
	];
	testCases.forEach(test => {
		it(`timeout ${test.timeout} should have an error level of ${test.expectedErrorLevel}`, () => {
			let errors = Servers.checkTimeoutValidity(test.timeout);
			expect(errors.getHighestErrorLevel()).toEqual(test.expectedErrorLevel);
		})
		it(`timeout ${test.timeout} should have ${test.expectedErrorLength} errors`, () => {
			let errors = Servers.checkTimeoutValidity(test.timeout);
			expect(errors.errors.length).toEqual(test.expectedErrorLength);
		})
	})

});


describe('Command Prefix Tests', () => {
	var testCases = [
		{
			prefix: '!',
			expectedErrorLevel: ErrorLevels.None,
			expectedErrorLength: 0
		},
		{
			prefix: '!b',
			expectedErrorLevel: ErrorLevels.Warning,
			expectedErrorLength: 1
		},
		{
			prefix: '??',
			expectedErrorLevel: ErrorLevels.None,
			expectedErrorLength: 0
		},
		{
			prefix: '\n',
			expectedErrorLevel: ErrorLevels.Critical,
			expectedErrorLength: 1
		},
		{
			prefix: '!!!',
			expectedErrorLevel: ErrorLevels.Critical,
			expectedErrorLength: 1
		}
	];
	testCases.forEach(test => {
		it(`prefix ${test.prefix} should have an error level of ${test.expectedErrorLevel}`, () => {
			let errors = Servers.checkCommandPrefixValidity(test.prefix);
			expect(errors.getHighestErrorLevel()).toEqual(test.expectedErrorLevel);
		})
		it(`prefix ${test.prefix} should have ${test.expectedErrorLevel} errors`, () => {
			let errors = Servers.checkCommandPrefixValidity(test.prefix);
			expect(errors.errors.length).toEqual(test.expectedErrorLength);
		})
	})

});


