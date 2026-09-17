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


"""[Expected Approach] Using Frequency Counting - O(n) time and O(1) auxiliary space"""



def firstRepChar(s):
    # Create an array to store the count of characters
    charCount = [0] * 26

    # Iterate through each character in the string
    for ch in s:

        # Calculate the index in the array for this character
        index = ord(ch) - ord('a')

        # If the count of the character is not zero,
        # it means the character is repeated, so we return it
        if charCount[index] != 0:
            return ch

        # Increment the count of the character in the array
        charCount[index] += 1

    # If no character is repeated, return "-1"
    return "-1"


# Example usage:
s = "geeksforgeeks"
print(firstRepChar(s))