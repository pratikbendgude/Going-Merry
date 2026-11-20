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