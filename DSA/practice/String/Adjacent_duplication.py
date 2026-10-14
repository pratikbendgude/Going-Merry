#!/usr/bin/env python3



"""[Naive Approach] Using Recursion - O(n ^ 2) Time and O(n ^ 2) Space"""


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



"""[Expected Approach] Using Recursion - O(n ^ 2) Time and O(n) Space"""



# Helper function to remove adjacent duplicates
def remove_util(s, n):
  
    # Index to store the result string
    k = 0

    # Iterate over the string to remove adjacent duplicates
    i = 0
    while i < n:
      
        # Check if the current character is the same as the next one
        if i < n - 1 and s[i] == s[i + 1]:
          
            # Skip all the adjacent duplicates
            while i < n - 1 and s[i] == s[i + 1]:
                i += 1
        else:
            # If not a duplicate, store the character
            s[k] = s[i]
            k += 1
        i += 1

    # Remove the remaining characters from the original string
    s = s[:k]

    # If any adjacent duplicates were removed, recursively check for more
    if k != n:
        s = remove_util(list(s), k)
    
    return s


# Function to initiate the removal of adjacent duplicates
def rremove(s):
    # Convert the string to a list to allow modification
    s = list(s)
    
    # Call the helper function
    return ''.join(remove_util(s, len(s)))


def main():
    s = "geeksforgeek"
    print(rremove(s))


if __name__ == "__main__":
    main()