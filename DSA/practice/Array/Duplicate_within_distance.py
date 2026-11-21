#!/usr/bin/env python3


"""[Naive Approach] Nested Loops - O(n * k) Time and O(1) Space"""


def checkWithinK(arr, k):
    n = len(arr)

    # Traverse for every element
    for i in range(n):
        # Traverse next k elements
        for c in range(1, k + 1):
            if i + c < n:
                j = i + c

                # If we find one more occurrence
                # within k
                if arr[i] == arr[j]:
                    return True
    return False

if __name__ == "__main__":
    arr = [1, 5, 4, 5, 1]
    k = 3

    print('true' if checkWithinK(arr, k) else 'false')




"""[Expected Approach] Hash Set - O(n) Time and O(k) Space"""
def checkWithinK(arr, k):
    # Creates an empty hashset
    s = set()

    # Traverse the input array
    for i in range(len(arr)):

        # If already present in hash, then we found
        # a duplicate within k distance
        if arr[i] in s:
            return True

        # Add this item to hashset
        s.add(arr[i])

        # Remove the element that is now k+1 positions away
        if i >= k:
            s.remove(arr[i - k])
    return False

if __name__ == "__main__":
    arr = [1, 5, 4, 5, 1]
    k = 3

    print('true' if checkWithinK(arr, k) else 'false')