#!/usr/bin/env python3


"""Iterative Approach - O(n) Time and O(1) Space"""

def myAtoi(s):
    sign = 1
    res = 0
    idx = 0
    n = len(s)

    # Ignore leading whitespaces
    while idx < n and s[idx] == ' ':
        idx += 1

    # Store the sign of number
    if idx < n and (s[idx] == '+' or s[idx] == '-'):
        if s[idx] == '-':
            sign = -1
        idx += 1

    # Construct the number digit by digit
    while idx < n and '0' <= s[idx] <= '9':
        digit = ord(s[idx]) - ord('0')
        res = 10 * res + digit

        # Handle overflow and underflow
        if res > 2**31 - 1:
            return (2**31 - 1) if sign == 1 else -2**31

        idx += 1

    return res * sign

if __name__ == "__main__":
    s = " -0012g4"
    print(myAtoi(s))



"""Recursive Approach - O(n) Time and O(n) Space"""


# Parse digits recursively with overflow handling
def parseDigits(s, idx, res, sign):
    if idx >= len(s) or s[idx] < '0' or s[idx] > '9':
        return res * sign

    digit = ord(s[idx]) - ord('0')

    if res > (2**31 - 1 - digit) // 10:
        return (2**31 - 1) if sign == 1 else -(2**31)

    return parseDigits(s, idx + 1, res * 10 + digit, sign)

def myAtoi(s):
    idx = 0

    # Skip leading spaces
    while idx < len(s) and s[idx] == ' ':
        idx += 1

    sign = 1

    # Handle sign
    if idx < len(s) and (s[idx] == '-' or s[idx] == '+'):
        if s[idx] == '-':
            sign = -1
        idx += 1

    return parseDigits(s, idx, 0, sign)

if __name__ == "__main__":
    print(myAtoi(" -0012g4"))