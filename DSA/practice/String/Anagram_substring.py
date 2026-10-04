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




"""[Expected Approach 1] Sorted Substring Hashing - O(n^3 log n) Time and O(n^3) Space"""
from collections import defaultdict

def countAnagramPairs(s):

    n = len(s)
    count = 0

    # Map to store frequency of sorted substrings
    freqMap = defaultdict(int)

    # Generate all substrings
    for i in range(n):
        curr = ""

        for j in range(i, n):
            curr += s[j]

            # Sort characters of the current substring
            sortedStr = ''.join(sorted(curr))

            # Increment count of this sorted pattern
            freqMap[sortedStr] += 1

    # Count total anagrammatic pairs from frequencies
    for f in freqMap.values():

        # Choose any 2 from f => f * (f - 1) / 2
        if f > 1:
            count += (f * (f - 1)) // 2

    return count
    
if __name__ == "__main__":

    s = "xyyx"

    print(countAnagramPairs(s))



"""[Expected Approach 2] Using Hash Map - O(n^2) Time and O(n^2) Space"""
def countAnagramPairs(s):
    n = len(s)
    count = 0
    mp = {}

    for i in range(n):
        freq = [0] * 26

        for j in range(i, n):
            freq[ord(s[j]) - ord('a')] += 1

            key = tuple(freq)  

            count += mp.get(key, 0)
            mp[key] = mp.get(key, 0) + 1

    return count

s = "abba"
print(countAnagramPairs(s))