﻿import { expect } from 'chai';

describe('Hello function', () =>
{
    it('should return hello world', () =>
    {
        const result = () =>
        {
            return "Hello World!";
        };
        expect(result).to.equal('Hello World!');
    });
});

