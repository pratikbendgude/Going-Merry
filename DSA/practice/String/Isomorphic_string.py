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

"""[Expected Approach 1] Using Hash Maps"""


def areIsomorphic(s1, s2):
    m1 = {}
    m2 = {}

    for i in range(len(s1)):

        # If character not seen before, store its
        # first occurrence index
        if s1[i] not in m1:
            m1[s1[i]] = i
        if s2[i] not in m2:
            m2[s2[i]] = i

        # Check if the first occurrence indices match
        if m1[s1[i]] != m2[s2[i]]:
            return False

    return True

if __name__ == "__main__":
    s1 = "aab"
    s2 = "xxy"
    if areIsomorphic(s1, s2):
        print("true")
    else:
        print("false")