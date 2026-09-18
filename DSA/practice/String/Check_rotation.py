#!/usr/bin/env python3


"""[Naive Approach] Generating all rotations - O(n^2) Time and O(1) Space """

def areRotations(s1, s2):
    n = len(s1)

    # generate and check all possible rotations of s1
    for _ in range(n):
        
        # if current rotation is equal to s2 return true
        if s1 == s2:
            return True

        # Right rotate s1
        s1 = s1[-1] + s1[:-1]

    return False

if __name__ == "__main__":
    s1 = "aab"
    s2 = "aba"

    print("true" if areRotations(s1, s2) else "false")