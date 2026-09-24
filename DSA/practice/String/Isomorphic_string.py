#!/usr/bin/env python3

"""[Naive Approach] Check Every Character - O(n^2) Time and O(1) Space"""

def areIsomorphic(s1, s2):
    n = len(s1)

    # Check every character of s1
    for i in range(n):
        c1 = s1[i]
        c2 = s2[i]

        # Check all occurrences of c1 in s1
        # and corresponding occurrences of c2 in s2
        for j in range(n):

            # If we find another occurrence of c1 in s1,
            # it must match the corresponding character in s2
            if s1[j] == c1 and s2[j] != c2:
                return False

            # If we find another occurrence of c2 in s2,
            # it must match the corresponding character in s1
            if s2[j] == c2 and s1[j] != c1:
                return False

    return True

if __name__ == "__main__":
    s1 = "aab"
    s2 = "xxy"

    if areIsomorphic(s1, s2):
        print("true")
    else:
        print("false")