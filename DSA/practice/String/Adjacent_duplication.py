#!/usr/bin/env python3





# Function to recursively remove adjacent duplicates
def rremove(s):
    # Initialize result string
    sb = ""
    # Get the size of the input string
    n = len(s)

    # Iterate over the length of current string
    i = 0
    while i < n:
        # Flag to check if the current character
        # is repeated
        repeated = False

        # Check if the current character
        # is the same as the next one
        while i + 1 < n and s[i] == s[i + 1]:
            # Mark as repeated
            repeated = True
            # Skip the next character since
            # it's a duplicate
            i += 1

        # If the character was not repeated, 
        # add it to the result string
        if not repeated:
            sb += s[i]
        i += 1

    # If no changes were made, return the result string
    if n == len(sb):
        return sb

    # Otherwise, recursively call the function
    # to check for more duplicates
    return rremove(sb)


def main():
    s = "geeksforgeek"
    result = rremove(s)
    print(result)


if __name__ == "__main__":
    main()