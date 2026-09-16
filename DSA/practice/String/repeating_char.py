#!/usr/bin/env python3

"""[Naive Approach] Using Two Nested Loops - O(n2) time and O(1) auxiliary space"""

def firstRepChar(s):

    # Get the size of the input string
    n = len(s)

    # Iterate through each character in the string
    for i in range(n):

        # Check if the current character is a repeating character
        for j in range(i):
            if s[i] == s[j]:

                # Return the repeating character
                return s[i]

    # If no repeating character is found, return "-1"
    return "-1"


# Example usage:
s = "geeksforgeeks"
print(firstRepChar(s))