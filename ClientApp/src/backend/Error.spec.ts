/* eslint-disable no-template-curly-in-string */
import { Error, ErrorLevels, Errors } from "./Error";

describe('error message and level check', () => {
	const testCases = [
		{
			error: new Error("errorMessage"),
			expected: "Critical: errorMessage",
			expectedLevel: ErrorLevels.Critical,
		},
		{
			error: new Error("errorMessage", ErrorLevels.Critical),
			expected: "Critical: errorMessage",
			expectedLevel: ErrorLevels.Critical,
		},
		{
			error: new Error("errorMessage", ErrorLevels.Warning),
			expected: "Warning: errorMessage",
			expectedLevel: ErrorLevels.Warning,
		}
	];

	testCases.forEach(test => {
		it(
			`should have the correct error message for ${test.error.message} and ${test.error.errorLevel} which is ${test.expected}`
			, () => {
			const message = test.error.getMessageWithLevel();
			expect(message).toEqual(test.expected);
		})
	})

	testCases.forEach(test => {
		it(
			`should have the correct highest error level ${test.error.errorLevel}`
			, () => {
			const errors = new Errors(test.error);
			expect(errors.getHighestErrorLevel()).toEqual(test.expectedLevel);
		})
	})

	it('\'s highest error level should be critical from one critical and one warning', () => {
		let errArr: Error[] = [];
		testCases.forEach(test => {
			errArr.push(test.error);
		});
		let errors: Errors = new Errors(errArr);
		expect(errors.getHighestErrorLevel()).toEqual(ErrorLevels.Critical);
	});

})

