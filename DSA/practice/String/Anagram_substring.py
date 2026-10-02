#!/usr/bin/env python3



"""[Naive Approach] Generate all substrings and Compare - O(n^5 log n) Time and O(n^3) Space """

def isAnagram(a, b):
    if len(a) != len(b):
        return False
    return sorted(a) == sorted(b)

def countAnagramPairs(s):
    n = len(s)
    substrings = []

    # Step 1: Generate all substrings
    for i in range(n):
        for length in range(1, n - i + 1):
            substrings.append(s[i:i+length])

    count = 0

    # Step 2: Compare every pair
    for i in range(len(substrings)):
        for j in range(i + 1, len(substrings)):
            if isAnagram(substrings[i], substrings[j]):
                count += 1

    return count

s = "abba"
print(countAnagramPairs(s))